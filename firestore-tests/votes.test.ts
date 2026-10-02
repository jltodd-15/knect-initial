/// <reference types="node" />
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

// Chats/{chatId}/Votes/{voteId} (ticket 3.3). Secured by membership in the parent chat. A
// participant may write their own ballot key and only their own, append an option, and the
// vote's created_by may cancel it while it is open. Everything that decides the outcome
// (status "closed", winning_option_id, closed_at, close_reason, final_counts) has no client
// clause at all: 17.2's tally writes them with the Admin SDK.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-votes',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed(CHAT, { participants: ['alice', 'bob', 'carol'], chat_name: 'Plans' });
});

afterAll(async () => {
  await testEnv.cleanup();
});

const as = (uid: string) => testEnv.authenticatedContext(uid).firestore();

const seed = (path: string, data: Record<string, unknown>) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(doc(context.firestore(), path), data),
  );

const CHAT = 'Chats/chat-1';
const VOTE = `${CHAT}/Votes/vote-1`;
const createdAt = Timestamp.fromMillis(1_800_000_000_000);

const optionA = { option_id: 'opt-a', label: 'Friday 7pm — Bowling' };
const optionB = { option_id: 'opt-b', label: 'Saturday 2pm — Bowling' };
const optionC = { option_id: 'opt-c', label: 'Sunday 11am — Bowling' };

// What 17.1 writes when alice opens a vote.
const newVote = {
  created_by: 'alice',
  vote_scope: 'open',
  vote_type: 'normal',
  status: 'open',
  question: 'When?',
  created_at: createdAt,
  resolves_at: Timestamp.fromMillis(1_800_000_000_000 + 24 * 3600 * 1000),
  options: [optionA, optionB],
  options_revision: 1,
  normal_votes: {},
  ranked_votes: {},
};
// An open vote bob and carol have already voted in.
const openVote = {
  ...newVote,
  normal_votes: { bob: 'opt-a' },
  ranked_votes: { carol: { order: ['opt-b', 'opt-a'], revision: 1 } },
};
// newVote with no ballot maps at all.
const voteWithoutMaps: Record<string, unknown> = { ...newVote };
delete voteWithoutMaps.normal_votes;
delete voteWithoutMaps.ranked_votes;
const closedVote = {
  ...openVote,
  status: 'closed',
  winning_option_id: 'opt-a',
  closed_at: createdAt,
  close_reason: 'timer',
  final_counts: { 'opt-a': 1 },
};

describe('allowed', () => {
  test('a participant creates an open vote at revision 1 as its creator', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), VOTE), newVote));
  });

  // Ballot maps may be left off at creation; the ballot clauses treat a missing map as empty.
  test('a participant creates a vote with no ballot maps', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), VOTE), voteWithoutMaps));
  });

  test('a participant reads the vote', async () => {
    await seed(VOTE, openVote);
    await assertSucceeds(getDoc(doc(as('bob'), VOTE)));
  });

  test('a participant writes their own key into normal_votes', async () => {
    await seed(VOTE, openVote);
    await assertSucceeds(
      updateDoc(doc(as('alice'), VOTE), { 'normal_votes.alice': 'opt-b' }),
    );
  });

  test('a participant writes their own key into ranked_votes', async () => {
    await seed(VOTE, openVote);
    await assertSucceeds(
      updateDoc(doc(as('alice'), VOTE), {
        'ranked_votes.alice': { order: ['opt-a', 'opt-b'], revision: 1 },
      }),
    );
  });

  test('the first ballot lands on a vote created without ballot maps', async () => {
    await seed(VOTE, voteWithoutMaps);
    await assertSucceeds(
      updateDoc(doc(as('bob'), VOTE), { 'normal_votes.bob': 'opt-a' }),
    );
  });

  test('a participant changes their own normal ballot', async () => {
    await seed(VOTE, openVote);
    await assertSucceeds(
      updateDoc(doc(as('bob'), VOTE), { 'normal_votes.bob': 'opt-b' }),
    );
  });

  test('a participant appends a third option and moves options_revision to 2', async () => {
    await seed(VOTE, openVote);
    await assertSucceeds(
      updateDoc(doc(as('bob'), VOTE), {
        options: [optionA, optionB, optionC],
        options_revision: 2,
      }),
    );
  });

  test('created_by cancels the vote while it is open', async () => {
    await seed(VOTE, openVote);
    await assertSucceeds(
      updateDoc(doc(as('alice'), VOTE), { status: 'cancelled' }),
    );
  });
});

describe('denied: reading and creating', () => {
  test('a non-participant reads the vote', async () => {
    await seed(VOTE, openVote);
    await assertFails(getDoc(doc(as('dave'), VOTE)));
  });

  test('a non-participant creates a vote', async () => {
    await assertFails(
      setDoc(doc(as('dave'), VOTE), { ...newVote, created_by: 'dave' }),
    );
  });

  test("a participant creates a vote with someone else's created_by", async () => {
    await assertFails(setDoc(doc(as('bob'), VOTE), newVote));
  });

  test('a participant creates a vote with status "closed"', async () => {
    await assertFails(
      setDoc(doc(as('alice'), VOTE), { ...newVote, status: 'closed' }),
    );
  });

  test('a participant creates a vote at options_revision 2', async () => {
    await assertFails(
      setDoc(doc(as('alice'), VOTE), { ...newVote, options_revision: 2 }),
    );
  });

  // Patched in the ticket's review: without a create allowlist, a vote could be born with its
  // result already decided or other people's ballots already cast.
  test.each([
    ['winning_option_id', 'opt-a'],
    ['closed_at', createdAt],
    ['close_reason', 'majority'],
    ['final_counts', { 'opt-a': 3 }],
  ])('a participant creates a vote carrying %s', async (field, value) => {
    await assertFails(
      setDoc(doc(as('alice'), VOTE), { ...newVote, [field]: value }),
    );
  });

  test("a participant creates a vote with someone else's normal ballot already cast", async () => {
    await assertFails(
      setDoc(doc(as('alice'), VOTE), {
        ...newVote,
        normal_votes: { bob: 'opt-a' },
      }),
    );
  });

  test("a participant creates a vote with someone else's ranked ballot already cast", async () => {
    await assertFails(
      setDoc(doc(as('alice'), VOTE), {
        ...newVote,
        ranked_votes: { bob: { order: ['opt-a', 'opt-b'], revision: 1 } },
      }),
    );
  });
});

describe('denied: ballots and results', () => {
  test("a participant overwrites another user's key in normal_votes", async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('alice'), VOTE), { 'normal_votes.bob': 'opt-b' }),
    );
  });

  test("a participant overwrites another user's key in ranked_votes", async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('alice'), VOTE), {
        'ranked_votes.carol': { order: ['opt-a', 'opt-b'], revision: 1 },
      }),
    );
  });

  test("a participant removes another user's ballot", async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('alice'), VOTE), { normal_votes: {} }),
    );
  });

  test('a participant writes their own ballot and someone else\'s in one write', async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('alice'), VOTE), {
        'normal_votes.alice': 'opt-a',
        // bob already holds opt-a, so this must differ for his key to count as changed.
        'normal_votes.bob': 'opt-b',
      }),
    );
  });

  test('a non-participant writes a ballot', async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('dave'), VOTE), { 'normal_votes.dave': 'opt-a' }),
    );
  });

  test('a participant writes a ballot on a vote whose status is "closed"', async () => {
    await seed(VOTE, closedVote);
    await assertFails(
      updateDoc(doc(as('alice'), VOTE), { 'normal_votes.alice': 'opt-a' }),
    );
  });

  test.each([
    ['winning_option_id', 'opt-a'],
    ['closed_at', createdAt],
    ['close_reason', 'majority'],
    ['final_counts', { 'opt-a': 3 }],
    ['status', 'closed'],
  ])('a participant writes %s', async (field, value) => {
    await seed(VOTE, openVote);
    await assertFails(updateDoc(doc(as('alice'), VOTE), { [field]: value }));
  });

  test('a participant deletes the vote', async () => {
    await seed(VOTE, openVote);
    await assertFails(deleteDoc(doc(as('alice'), VOTE)));
  });
});

describe('denied: cancelling', () => {
  test('a participant who is not created_by cancels the vote', async () => {
    await seed(VOTE, openVote);
    await assertFails(updateDoc(doc(as('bob'), VOTE), { status: 'cancelled' }));
  });

  test('created_by cancels a vote that is already "closed"', async () => {
    await seed(VOTE, closedVote);
    await assertFails(
      updateDoc(doc(as('alice'), VOTE), { status: 'cancelled' }),
    );
  });

  test('created_by cancels a vote that is already "cancelled"', async () => {
    await seed(VOTE, { ...openVote, status: 'cancelled' });
    await assertFails(
      updateDoc(doc(as('alice'), VOTE), { status: 'cancelled' }),
    );
  });
});

describe('denied: options', () => {
  test("a participant edits an existing option's label", async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('bob'), VOTE), {
        options: [optionA, { ...optionB, label: 'Saturday 9pm — Karaoke' }, optionC],
        options_revision: 2,
      }),
    );
  });

  test('a participant removes an option', async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('bob'), VOTE), { options: [optionA], options_revision: 2 }),
    );
  });

  test('a participant replaces an option in place, keeping the count', async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('bob'), VOTE), {
        options: [optionA, optionC],
        options_revision: 2,
      }),
    );
  });

  test('a participant appends an option without incrementing options_revision', async () => {
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('bob'), VOTE), { options: [optionA, optionB, optionC] }),
    );
  });

  test('a participant appends two options at once', async () => {
    const optionD = { option_id: 'opt-d', label: 'Monday 6pm — Bowling' };
    await seed(VOTE, openVote);
    await assertFails(
      updateDoc(doc(as('bob'), VOTE), {
        options: [optionA, optionB, optionC, optionD],
        options_revision: 2,
      }),
    );
  });

  test('a participant appends an option to a closed vote', async () => {
    await seed(VOTE, closedVote);
    await assertFails(
      updateDoc(doc(as('bob'), VOTE), {
        options: [optionA, optionB, optionC],
        options_revision: 2,
      }),
    );
  });
});

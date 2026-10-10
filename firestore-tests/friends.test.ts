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
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

// Users/{userId}/Friends/{friendId} (ticket 3.2). Create is constrained by direction: in your own
// document you may only claim you sent a request; in someone else's you may only leave a pending
// one. Update is owner-only. Either party may delete.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-friends',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

const as = (uid: string) => testEnv.authenticatedContext(uid).firestore();

const seed = (path: string, data: Record<string, unknown>) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(doc(context.firestore(), path), data),
  );

const readStatus = async (path: string) => {
  let status: unknown;
  await testEnv.withSecurityRulesDisabled(async context => {
    status = (await getDoc(doc(context.firestore(), path))).get('status');
  });
  return status;
};

// Alice's entry for Bob, and Bob's entry for Alice.
const ALICES = 'Users/alice/Friends/bob';
const BOBS = 'Users/bob/Friends/alice';

describe('allowed', () => {
  test('A sends a request: both halves created by A in one batch', async () => {
    const db = as('alice');
    const batch = writeBatch(db);
    batch.set(doc(db, ALICES), { status: 'request_sent' });
    batch.set(doc(db, BOBS), { status: 'pending' });
    await assertSucceeds(batch.commit());
  });

  test('B accepts their own half: Users/B/Friends/A becomes "friend"', async () => {
    await seed(ALICES, { status: 'request_sent' });
    await seed(BOBS, { status: 'pending' });
    await assertSucceeds(updateDoc(doc(as('bob'), BOBS), { status: 'friend' }));
  });

  test('A stars B: only A\'s document becomes "close_friend"', async () => {
    await seed(ALICES, { status: 'friend' });
    await seed(BOBS, { status: 'friend' });
    await assertSucceeds(
      updateDoc(doc(as('alice'), ALICES), { status: 'close_friend' }),
    );
    // close_friend is one-sided by design: the other document does not move.
    expect(await readStatus(ALICES)).toBe('close_friend');
    expect(await readStatus(BOBS)).toBe('friend');
  });

  test('the owner deletes a Friends entry in their own list', async () => {
    await seed(ALICES, { status: 'friend' });
    await assertSucceeds(deleteDoc(doc(as('alice'), ALICES)));
  });

  test("the other party deletes the entry about them in someone else's list", async () => {
    await seed(ALICES, { status: 'friend' });
    await assertSucceeds(deleteDoc(doc(as('bob'), ALICES)));
  });

  test("a signed-in user reads someone else's Friends entry", async () => {
    await seed(ALICES, { status: 'friend' });
    await assertSucceeds(getDoc(doc(as('carol'), ALICES)));
  });

  // Ticket 4.4: the two queries behind the Search tab's Friends and Pending Requests sections.
  test('a signed-in user queries their own Friends by status', async () => {
    await seed('Users/alice/Friends/bob', { status: 'friend' });
    await seed('Users/alice/Friends/carol', { status: 'close_friend' });
    await seed('Users/alice/Friends/dave', { status: 'pending' });
    await seed('Users/alice/Friends/erin', { status: 'request_sent' });
    const friends = collection(as('alice'), 'Users/alice/Friends');

    const accepted = await assertSucceeds(
      getDocs(query(friends, where('status', 'in', ['friend', 'close_friend']))),
    );
    expect(accepted.docs.map(d => d.id).sort()).toEqual(['bob', 'carol']);

    const pending = await assertSucceeds(
      getDocs(query(friends, where('status', '==', 'pending'))),
    );
    expect(pending.docs.map(d => d.id)).toEqual(['dave']);
  });

  // Ticket 4.6: the two count queries behind the Search tab's Friends box.
  test('a signed-in user counts their own Friends by status', async () => {
    await seed('Users/alice/Friends/bob', { status: 'friend' });
    await seed('Users/alice/Friends/carol', { status: 'close_friend' });
    await seed('Users/alice/Friends/dave', { status: 'pending' });
    const friends = collection(as('alice'), 'Users/alice/Friends');

    const all = await assertSucceeds(
      getCountFromServer(query(friends, where('status', 'in', ['friend', 'close_friend']))),
    );
    expect(all.data().count).toBe(2);

    const close = await assertSucceeds(
      getCountFromServer(query(friends, where('status', '==', 'close_friend'))),
    );
    expect(close.data().count).toBe(1);
  });
});

describe('denied', () => {
  test('a user updates status to a string outside the four values', async () => {
    await seed(ALICES, { status: 'friend' });
    await assertFails(
      updateDoc(doc(as('alice'), ALICES), { status: 'best_friend' }),
    );
  });

  // The most important deny case in ticket 3.2: nobody can manufacture a friendship in someone
  // else's list. In another user's document the only creatable value is "pending".
  test.each(['friend', 'close_friend', 'request_sent'])(
    'A creates Users/B/Friends/A with "%s"',
    async status => {
      await assertFails(setDoc(doc(as('alice'), BOBS), { status }));
    },
  );

  // In your own document the only creatable value is "request_sent".
  test.each(['pending', 'friend', 'close_friend'])(
    'A creates their own Users/A/Friends/B with "%s"',
    async status => {
      await assertFails(setDoc(doc(as('alice'), ALICES), { status }));
    },
  );

  test('a Friends entry created in your own list carrying a field other than status', async () => {
    await assertFails(
      setDoc(doc(as('alice'), ALICES), { status: 'request_sent', note: 'hi' }),
    );
  });

  test("a Friends entry created in someone else's list carrying a field other than status", async () => {
    await assertFails(
      setDoc(doc(as('alice'), BOBS), { status: 'pending', note: 'hi' }),
    );
  });

  test('an update that adds a field other than status', async () => {
    await seed(ALICES, { status: 'friend' });
    await assertFails(
      updateDoc(doc(as('alice'), ALICES), { status: 'friend', note: 'hi' }),
    );
  });

  // NOT A BUG. This is the client-side acceptance case, and it is denied by ruling (Decision Log
  // B9): acceptance runs through the acceptFriendRequest Cloud Function, which has to check the
  // recipient's blocked_users and find-or-create the 1-on-1 chat, neither of which a client can
  // do. Do not "fix" this by letting friendId update. If a client-side acceptance path is ever
  // added, ticket 3.4's audit decides the clause.
  test('B updates Users/A/Friends/B, the other half of an acceptance', async () => {
    await seed(ALICES, { status: 'request_sent' });
    await seed(BOBS, { status: 'pending' });
    await assertFails(updateDoc(doc(as('bob'), ALICES), { status: 'friend' }));
  });

  test('a third party creates an entry between two other users', async () => {
    await assertFails(setDoc(doc(as('carol'), BOBS), { status: 'pending' }));
  });

  test('a third party deletes an entry between two other users', async () => {
    await seed(ALICES, { status: 'friend' });
    await assertFails(deleteDoc(doc(as('carol'), ALICES)));
  });
});

// A user who has been blocked cannot leave a request in the blocker's list. Declining is not
// blocking: a declined request can be sent again.
describe('blocked users', () => {
  const BOBS_PRIVATE = 'Users/bob/Private_info/main';

  const sendRequest = () => {
    const db = as('alice');
    const batch = writeBatch(db);
    batch.set(doc(db, ALICES), { status: 'request_sent' });
    batch.set(doc(db, BOBS), { status: 'pending' });
    return batch.commit();
  };

  test('denied: A leaves a pending request in the list of B, who has blocked A', async () => {
    await seed(BOBS_PRIVATE, { blocked_users: ['alice'] });
    await assertFails(setDoc(doc(as('alice'), BOBS), { status: 'pending' }));
  });

  test('denied: the whole request batch, when B has blocked A', async () => {
    await seed(BOBS_PRIVATE, { blocked_users: ['alice'] });
    await assertFails(sendRequest());
  });

  test('allowed: A requests B, who has blocked someone else', async () => {
    await seed(BOBS_PRIVATE, { blocked_users: ['carol'] });
    await assertSucceeds(sendRequest());
  });

  test('allowed: A requests B, whose Private_info has no blocked_users field', async () => {
    await seed(BOBS_PRIVATE, { email: 'bob@example.com' });
    await assertSucceeds(sendRequest());
  });

  test('allowed: A requests B again after B declined', async () => {
    await seed(BOBS_PRIVATE, { blocked_users: [] });
    await assertSucceeds(sendRequest());
    // Declining deletes both halves; either party may delete.
    await assertSucceeds(deleteDoc(doc(as('bob'), BOBS)));
    await assertSucceeds(deleteDoc(doc(as('bob'), ALICES)));
    await assertSucceeds(sendRequest());
  });
});

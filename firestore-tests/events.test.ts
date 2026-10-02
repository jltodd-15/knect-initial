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

// Events/{eventId} (ticket 3.3), replacing the old Calendars collection. Secured by membership in
// shared_with, with no owner fallback. A member writes their own rsvps key only, inside three
// windows (see the RSVP tests). Any participant of the linked chat may update shared_with. The
// owner may cancel. "confirmed", "expired", confirmed_participants and applying a winning
// alternative are Admin-SDK-only, and no client deletes an event: it is cancelled instead.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-events',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed(CHAT, {
    participants: ['alice', 'bob', 'carol', 'dave'],
    chat_name: 'Plans',
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

const as = (uid: string) => testEnv.authenticatedContext(uid).firestore();

const seed = (path: string, data: Record<string, unknown>) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(doc(context.firestore(), path), data),
  );

const DAY = 24 * 3600 * 1000;
const CHAT = 'Chats/chat-1';
const EVENT = 'Events/event-1';

// Built per test, so "ahead" and "passed" are relative to when the test runs.
const newEvent = () => ({
  owner_id: 'alice',
  shared_with: ['alice', 'bob', 'carol'],
  rsvps: { alice: 'going' },
  event_time: Timestamp.fromMillis(Date.now() + 3 * DAY),
  end_time: Timestamp.fromMillis(Date.now() + 3 * DAY + 2 * 3600 * 1000),
  created_at: Timestamp.now(),
  resolves_at: Timestamp.fromMillis(Date.now() + DAY),
  event_title: 'Bowling',
  status: 'proposed',
  linked_chat_id: 'chat-1',
  source: 'Knect',
});
// bob has not answered yet; carol has.
const existingEvent = (overrides: Record<string, unknown> = {}) => ({
  ...newEvent(),
  rsvps: { alice: 'going', bob: 'pending', carol: 'going' },
  ...overrides,
});
const passed = () => Timestamp.fromMillis(Date.now() - DAY);

describe('allowed', () => {
  test('an owner creates an event with their own owner_id', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), EVENT), newEvent()));
  });

  test('an owner creates a "candidate" event', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), EVENT), { ...newEvent(), status: 'candidate' }),
    );
  });

  test('a member of shared_with reads the event', async () => {
    await seed(EVENT, existingEvent());
    await assertSucceeds(getDoc(doc(as('bob'), EVENT)));
  });

  test('a member writes their own rsvps key on a "proposed" event, then changes it', async () => {
    await seed(EVENT, existingEvent());
    await assertSucceeds(
      updateDoc(doc(as('bob'), EVENT), { 'rsvps.bob': 'going' }),
    );
    await assertSucceeds(
      updateDoc(doc(as('bob'), EVENT), { 'rsvps.bob': 'not_going' }),
    );
  });

  test('a member with no rsvps key yet answers a "proposed" event', async () => {
    await seed(EVENT, existingEvent({ rsvps: { alice: 'going' } }));
    await assertSucceeds(
      updateDoc(doc(as('carol'), EVENT), { 'rsvps.carol': 'going' }),
    );
  });

  test('on a "confirmed" event still ahead, a member holding "pending" answers once', async () => {
    await seed(EVENT, existingEvent({ status: 'confirmed' }));
    await assertSucceeds(
      updateDoc(doc(as('bob'), EVENT), { 'rsvps.bob': 'going' }),
    );
    // The same clause now denies a second answer: bob's key no longer holds "pending".
    await assertFails(
      updateDoc(doc(as('bob'), EVENT), { 'rsvps.bob': 'not_going' }),
    );
  });

  test("a participant of the linked chat updates shared_with", async () => {
    await seed(EVENT, existingEvent());
    await assertSucceeds(
      updateDoc(doc(as('dave'), EVENT), {
        shared_with: ['alice', 'bob', 'carol', 'dave'],
      }),
    );
  });

  test.each(['proposed', 'confirmed'])(
    'the owner cancels from "%s"',
    async status => {
      await seed(EVENT, existingEvent({ status }));
      await assertSucceeds(
        updateDoc(doc(as('alice'), EVENT), { status: 'cancelled' }),
      );
    },
  );
});

describe('denied: creating and reading', () => {
  test("a user creates an event with someone else's owner_id", async () => {
    await assertFails(
      setDoc(doc(as('bob'), EVENT), { ...newEvent(), rsvps: { bob: 'going' } }),
    );
  });

  // Patched in the ticket's review: without these, an event could be born already decided.
  test.each(['confirmed', 'expired', 'cancelled'])(
    'an owner creates an event with status "%s"',
    async status => {
      await assertFails(
        setDoc(doc(as('alice'), EVENT), { ...newEvent(), status }),
      );
    },
  );

  test('an owner creates an event carrying confirmed_participants', async () => {
    await assertFails(
      setDoc(doc(as('alice'), EVENT), {
        ...newEvent(),
        confirmed_participants: ['alice'],
      }),
    );
  });

  test("an owner creates an event with someone else's rsvps key filled in", async () => {
    await assertFails(
      setDoc(doc(as('alice'), EVENT), {
        ...newEvent(),
        rsvps: { alice: 'going', bob: 'going' },
      }),
    );
  });

  test('an owner creates an event carrying a field outside the schema', async () => {
    await assertFails(
      setDoc(doc(as('alice'), EVENT), { ...newEvent(), pinned: true }),
    );
  });

  test('a user not in shared_with reads the event', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(getDoc(doc(as('dave'), EVENT)));
  });

  // NOT A BUG. Read requires membership in shared_with with no owner fallback: the schema's
  // decided text dropped the owner half of the old Calendars rule. shared_with mirrors the chat's
  // participants and the proposer is always one, so this should never happen in practice. If the
  // behavior is wrong, it is a one-line change to the read clause.
  test('the owner reads their own event when absent from shared_with', async () => {
    await seed(EVENT, existingEvent({ shared_with: ['bob', 'carol'] }));
    await assertFails(getDoc(doc(as('alice'), EVENT)));
  });
});

// The RSVP clause, read as three windows:
//   event_time has passed                → denied, every time
//   "proposed", event still ahead        → write and change your own key freely
//   resolved, event still ahead          → only while your key holds "pending": answer once
describe('denied: RSVPs', () => {
  test("a member writes another member's rsvps key", async () => {
    await seed(EVENT, existingEvent());
    await assertFails(
      updateDoc(doc(as('bob'), EVENT), { 'rsvps.carol': 'not_going' }),
    );
  });

  test('a user not in shared_with writes their own rsvps key', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(
      updateDoc(doc(as('dave'), EVENT), { 'rsvps.dave': 'going' }),
    );
  });

  test.each(['proposed', 'confirmed'])(
    'a member answers a "%s" event whose event_time has passed',
    async status => {
      await seed(EVENT, existingEvent({ status, event_time: passed() }));
      await assertFails(
        updateDoc(doc(as('bob'), EVENT), { 'rsvps.bob': 'going' }),
      );
    },
  );

  test('a member holding "going" changes it on a "confirmed" event still ahead', async () => {
    await seed(EVENT, existingEvent({ status: 'confirmed' }));
    await assertFails(
      updateDoc(doc(as('carol'), EVENT), { 'rsvps.carol': 'not_going' }),
    );
  });

  test('a member writes their rsvps key and something else in one write', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(
      updateDoc(doc(as('bob'), EVENT), {
        'rsvps.bob': 'going',
        event_title: 'Karaoke',
      }),
    );
  });
});

describe('denied: shared_with, status and deletes', () => {
  test('a user outside the linked chat updates shared_with', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(
      updateDoc(doc(as('erin'), EVENT), {
        shared_with: ['alice', 'bob', 'carol', 'erin'],
      }),
    );
  });

  test('a chat participant updates shared_with on an event with no linked_chat_id', async () => {
    const unlinked: Record<string, unknown> = existingEvent();
    delete unlinked.linked_chat_id;
    await seed(EVENT, unlinked);
    await assertFails(
      updateDoc(doc(as('dave'), EVENT), {
        shared_with: ['alice', 'bob', 'carol', 'dave'],
      }),
    );
  });

  test.each([
    ['status', 'confirmed'],
    ['status', 'expired'],
    ['confirmed_participants', ['alice', 'bob']],
  ])('the owner writes %s: %j', async (field, value) => {
    await seed(EVENT, existingEvent());
    await assertFails(updateDoc(doc(as('alice'), EVENT), { [field]: value }));
  });

  // A write that changes nothing must not slip through a clause whose only field check is
  // "nothing else changed". Each clause requires its own field to actually change.
  test('a chat participant outside shared_with rewrites shared_with unchanged', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(
      updateDoc(doc(as('dave'), EVENT), {
        shared_with: ['alice', 'bob', 'carol'],
      }),
    );
  });

  test('a member rewrites their own rsvps key unchanged on a "proposed" event', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(
      updateDoc(doc(as('carol'), EVENT), { 'rsvps.carol': 'going' }),
    );
  });

  test('a member who is not the owner cancels the event', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(
      updateDoc(doc(as('bob'), EVENT), { status: 'cancelled' }),
    );
  });

  test.each(['expired', 'cancelled'])(
    'the owner cancels from "%s"',
    async status => {
      await seed(EVENT, existingEvent({ status }));
      await assertFails(
        updateDoc(doc(as('alice'), EVENT), { status: 'cancelled' }),
      );
    },
  );

  test('the owner deletes the event', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(deleteDoc(doc(as('alice'), EVENT)));
  });

  test('a member deletes the event', async () => {
    await seed(EVENT, existingEvent());
    await assertFails(deleteDoc(doc(as('bob'), EVENT)));
  });
});

// The old collection must be dead, not merely unused.
describe('denied: /Calendars', () => {
  const CALENDAR = 'Calendars/event-1';

  test('a user creates a Calendars document', async () => {
    await assertFails(setDoc(doc(as('alice'), CALENDAR), newEvent()));
  });

  test('a user reads a Calendars document', async () => {
    await seed(CALENDAR, newEvent());
    await assertFails(getDoc(doc(as('alice'), CALENDAR)));
  });

  test('a user updates a Calendars document', async () => {
    await seed(CALENDAR, newEvent());
    await assertFails(
      updateDoc(doc(as('alice'), CALENDAR), { event_title: 'Karaoke' }),
    );
  });

  test('a user deletes a Calendars document', async () => {
    await seed(CALENDAR, newEvent());
    await assertFails(deleteDoc(doc(as('alice'), CALENDAR)));
  });
});

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
  deleteField,
  doc,
  getDoc,
  increment,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

// Activities/{activityId} (ticket 3.2). Readable by every signed-in user. Write access is gated on
// source == "user_generated", a field every Activity has, rather than on creator_id, which seeded
// activities lack. Any signed-in user may move click_count and likes one step at a time, and
// nothing else.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-activities',
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

const createdAt = Timestamp.fromMillis(1_800_000_000_000);

// A seeded activity: no creator_id.
const SEEDED = 'Activities/seeded-1';
const seededActivity = {
  name: 'Sunset picnic',
  description: 'Bring a blanket.',
  cost: 'Free',
  source: 'manual_diy',
  category: 'Outdoors',
  tags: ['Picnics'],
  is_location_based: false,
  click_count: 0,
  likes: 0,
  created_at: createdAt,
};

const OWN = 'Activities/user-1';
const aliceActivity = {
  ...seededActivity,
  name: 'Board game night',
  source: 'user_generated',
  creator_id: 'alice',
};

describe('allowed', () => {
  test('a signed-in user reads an activity', async () => {
    await seed(SEEDED, seededActivity);
    await assertSucceeds(getDoc(doc(as('alice'), SEEDED)));
  });

  test('any signed-in user updates only click_count and likes on a seeded activity', async () => {
    await seed(SEEDED, seededActivity);
    await assertSucceeds(
      updateDoc(doc(as('bob'), SEEDED), {
        click_count: increment(1),
        likes: increment(1),
      }),
    );
  });

  test('a user creates an activity with source "user_generated" and their own creator_id', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), OWN), aliceActivity));
  });

  test('the creator updates their own user-generated activity', async () => {
    await seed(OWN, aliceActivity);
    await assertSucceeds(
      updateDoc(doc(as('alice'), OWN), { name: 'Board game afternoon' }),
    );
  });

  test('the creator deletes their own user-generated activity', async () => {
    await seed(OWN, aliceActivity);
    await assertSucceeds(deleteDoc(doc(as('alice'), OWN)));
  });
});

describe('denied', () => {
  test('an unauthenticated client reads an activity', async () => {
    await seed(SEEDED, seededActivity);
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, SEEDED)));
  });

  test('a user creates an activity with source "manual_diy"', async () => {
    await assertFails(
      setDoc(doc(as('alice'), OWN), { ...aliceActivity, source: 'manual_diy' }),
    );
  });

  test("a user creates an activity with someone else's creator_id", async () => {
    await assertFails(
      setDoc(doc(as('alice'), OWN), { ...aliceActivity, creator_id: 'bob' }),
    );
  });

  test('a user updates a seeded activity', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(updateDoc(doc(as('alice'), SEEDED), { name: 'Renamed' }));
  });

  test('a user deletes a seeded activity', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(deleteDoc(doc(as('alice'), SEEDED)));
  });

  test('a user updates likes and name in the same write', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(
      updateDoc(doc(as('bob'), SEEDED), {
        likes: increment(1),
        name: 'Renamed',
      }),
    );
  });

  test("another user edits someone else's user-generated activity", async () => {
    await seed(OWN, aliceActivity);
    await assertFails(updateDoc(doc(as('bob'), OWN), { name: 'Renamed' }));
  });

  test("another user deletes someone else's user-generated activity", async () => {
    await seed(OWN, aliceActivity);
    await assertFails(deleteDoc(doc(as('bob'), OWN)));
  });

  // Both fields are deferred to ticket 13.3, which adds them to the create allowlist.
  test('a user creates an activity carrying is_active', async () => {
    await assertFails(
      setDoc(doc(as('alice'), OWN), { ...aliceActivity, is_active: true }),
    );
  });

  test('a user creates an activity carrying updated_at', async () => {
    await assertFails(
      setDoc(doc(as('alice'), OWN), {
        ...aliceActivity,
        updated_at: createdAt,
      }),
    );
  });
});

// The counters move one step at a time: likes by exactly +1 or -1 and never below zero,
// click_count by exactly +1. Anything else would let one account reorder Discover.
describe('counter steps: allowed', () => {
  test('a user likes an activity: likes moves by +1', async () => {
    await seed(SEEDED, seededActivity);
    await assertSucceeds(
      updateDoc(doc(as('bob'), SEEDED), { likes: increment(1) }),
    );
  });

  test('a user unlikes an activity: likes moves by -1', async () => {
    await seed(SEEDED, { ...seededActivity, likes: 3 });
    await assertSucceeds(
      updateDoc(doc(as('bob'), SEEDED), { likes: increment(-1) }),
    );
  });

  test('a user opens an activity: click_count moves by +1', async () => {
    await seed(SEEDED, seededActivity);
    await assertSucceeds(
      updateDoc(doc(as('bob'), SEEDED), { click_count: increment(1) }),
    );
  });

  test('the first like on an activity that has no likes field yet', async () => {
    const { likes, ...withoutLikes } = seededActivity;
    expect(likes).toBe(0);
    await seed(SEEDED, withoutLikes);
    await assertSucceeds(
      updateDoc(doc(as('bob'), SEEDED), { likes: increment(1) }),
    );
  });

  test('the creator likes their own activity', async () => {
    await seed(OWN, aliceActivity);
    await assertSucceeds(
      updateDoc(doc(as('alice'), OWN), { likes: increment(1) }),
    );
  });
});

describe('counter steps: denied', () => {
  test('a user sets likes to an arbitrary number', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(updateDoc(doc(as('bob'), SEEDED), { likes: 1000000 }));
  });

  test('a user moves likes by more than one', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(
      updateDoc(doc(as('bob'), SEEDED), { likes: increment(2) }),
    );
  });

  test('a user takes likes below zero', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(
      updateDoc(doc(as('bob'), SEEDED), { likes: increment(-1) }),
    );
  });

  test('a user sets likes to something that is not an integer', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(updateDoc(doc(as('bob'), SEEDED), { likes: 'lots' }));
    await assertFails(updateDoc(doc(as('bob'), SEEDED), { likes: 0.5 }));
  });

  test('a user deletes the likes field', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(
      updateDoc(doc(as('bob'), SEEDED), { likes: deleteField() }),
    );
  });

  test('a user moves click_count by more than one', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(
      updateDoc(doc(as('bob'), SEEDED), { click_count: increment(5) }),
    );
  });

  test('a user decrements click_count', async () => {
    await seed(SEEDED, { ...seededActivity, click_count: 4 });
    await assertFails(
      updateDoc(doc(as('bob'), SEEDED), { click_count: increment(-1) }),
    );
  });

  test('a user deletes the click_count field', async () => {
    await seed(SEEDED, seededActivity);
    await assertFails(
      updateDoc(doc(as('bob'), SEEDED), { click_count: deleteField() }),
    );
  });
});

// The creator may edit their own activity, but not who owns it, where it came from, or how many
// likes it has.
describe('creator edits: denied', () => {
  test('the creator changes creator_id on their own activity', async () => {
    await seed(OWN, aliceActivity);
    await assertFails(updateDoc(doc(as('alice'), OWN), { creator_id: 'bob' }));
  });

  test('the creator changes source on their own activity', async () => {
    await seed(OWN, aliceActivity);
    await assertFails(
      updateDoc(doc(as('alice'), OWN), { source: 'manual_diy' }),
    );
  });

  test('the creator sets likes on their own activity', async () => {
    await seed(OWN, aliceActivity);
    await assertFails(updateDoc(doc(as('alice'), OWN), { likes: 500 }));
  });

  test('the creator edits a field and likes in the same write', async () => {
    await seed(OWN, aliceActivity);
    await assertFails(
      updateDoc(doc(as('alice'), OWN), {
        name: 'Board game afternoon',
        likes: increment(1),
      }),
    );
  });

  test('the creator sets click_count on their own activity', async () => {
    await seed(OWN, aliceActivity);
    await assertFails(updateDoc(doc(as('alice'), OWN), { click_count: 500 }));
  });
});

// A new activity starts its counters at zero: nobody creates one that is already popular.
describe('counters at creation', () => {
  test('allowed: an activity created with no counter fields at all', async () => {
    const { likes, click_count, ...withoutCounters } = aliceActivity;
    expect([likes, click_count]).toEqual([0, 0]);
    await assertSucceeds(setDoc(doc(as('alice'), OWN), withoutCounters));
  });

  test('allowed: the creator opens their own activity, click_count +1', async () => {
    await seed(OWN, aliceActivity);
    await assertSucceeds(
      updateDoc(doc(as('alice'), OWN), { click_count: increment(1) }),
    );
  });

  test('denied: an activity created with likes already above zero', async () => {
    await assertFails(
      setDoc(doc(as('alice'), OWN), { ...aliceActivity, likes: 500 }),
    );
  });

  test('denied: an activity created with click_count already above zero', async () => {
    await assertFails(
      setDoc(doc(as('alice'), OWN), { ...aliceActivity, click_count: 500 }),
    );
  });
});

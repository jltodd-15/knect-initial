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
  increment,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

// Activities/{activityId} (ticket 3.2). Readable by every signed-in user. Write access is gated on
// source == "user_generated", a field every Activity has, rather than on creator_id, which seeded
// activities lack. Any signed-in user may change click_count and likes, and nothing else.

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

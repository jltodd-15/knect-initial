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
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

// Users/{userId}/Liked_Activities/{activityId}: owner-only, saved_at (ticket 3.2). Project 11's
// like write and Project 12's Saved list both depend on this block.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-liked-activities',
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

const LIKE = 'Users/alice/Liked_Activities/activity-1';
const like = () => ({ saved_at: Timestamp.fromMillis(1_800_000_000_000) });

describe('allowed', () => {
  test('a user writes their own Liked_Activities entry with saved_at', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), LIKE), { saved_at: serverTimestamp() }),
    );
  });

  test('a user reads their own Liked_Activities entry', async () => {
    await seed(LIKE, like());
    await assertSucceeds(getDoc(doc(as('alice'), LIKE)));
  });

  test('a user deletes their own Liked_Activities entry', async () => {
    await seed(LIKE, like());
    await assertSucceeds(deleteDoc(doc(as('alice'), LIKE)));
  });
});

describe('denied', () => {
  test("another user reads someone else's Liked_Activities entry", async () => {
    await seed(LIKE, like());
    await assertFails(getDoc(doc(as('bob'), LIKE)));
  });

  test("another user creates an entry in someone else's Liked_Activities", async () => {
    await assertFails(setDoc(doc(as('bob'), LIKE), like()));
  });

  test("another user deletes an entry in someone else's Liked_Activities", async () => {
    await seed(LIKE, like());
    await assertFails(deleteDoc(doc(as('bob'), LIKE)));
  });

  test('a user writes an undeclared field onto their own Liked_Activities entry', async () => {
    await assertFails(
      setDoc(doc(as('alice'), LIKE), { ...like(), activity_name: 'Bowling' }),
    );
  });
});

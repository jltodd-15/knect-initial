/// <reference types="node" />
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Users/{userId}/Activity_History/{historyId}: owner-only, activity_reference and tapped_ads
// (ticket 3.2).

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-activity-history',
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

const ENTRY = 'Users/alice/Activity_History/history-1';
const entry = { activity_reference: 'activity-1', tapped_ads: [] };

describe('allowed', () => {
  test('a user writes an Activity_History entry on their own subcollection', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), ENTRY), entry));
  });

  test('a user reads their own Activity_History entry', async () => {
    await seed(ENTRY, entry);
    await assertSucceeds(getDoc(doc(as('alice'), ENTRY)));
  });

  test('a user updates their own Activity_History entry', async () => {
    await seed(ENTRY, entry);
    await assertSucceeds(
      updateDoc(doc(as('alice'), ENTRY), { tapped_ads: ['ad-1'] }),
    );
  });

  test('a user deletes their own Activity_History entry', async () => {
    await seed(ENTRY, entry);
    await assertSucceeds(deleteDoc(doc(as('alice'), ENTRY)));
  });
});

describe('denied', () => {
  test("another user reads someone else's Activity_History entry", async () => {
    await seed(ENTRY, entry);
    await assertFails(getDoc(doc(as('bob'), ENTRY)));
  });

  test("another user creates an entry in someone else's Activity_History", async () => {
    await assertFails(setDoc(doc(as('bob'), ENTRY), entry));
  });

  test("another user updates an entry in someone else's Activity_History", async () => {
    await seed(ENTRY, entry);
    await assertFails(
      updateDoc(doc(as('bob'), ENTRY), { tapped_ads: ['ad-1'] }),
    );
  });

  test("another user deletes an entry in someone else's Activity_History", async () => {
    await seed(ENTRY, entry);
    await assertFails(deleteDoc(doc(as('bob'), ENTRY)));
  });

  test('a user writes an undeclared field onto their own Activity_History entry', async () => {
    await assertFails(
      setDoc(doc(as('alice'), ENTRY), { ...entry, viewed_at: 'now' }),
    );
  });
});

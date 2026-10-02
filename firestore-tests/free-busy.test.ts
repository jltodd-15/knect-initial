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

// Users/{userId}/Free_Busy/{blockId}: readable by every signed-in user (a block says only that
// you are busy), writable by its owner with start_time and end_time (ticket 3.2).

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-free-busy',
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

const BLOCK = 'Users/alice/Free_Busy/block-1';
const block = () => ({
  start_time: Timestamp.fromMillis(1_800_000_000_000),
  end_time: Timestamp.fromMillis(1_800_003_600_000),
});

describe('allowed', () => {
  test('a user writes a Free_Busy block on their own subcollection', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), BLOCK), block()));
  });

  test("a signed-in user reads a stranger's Free_Busy block", async () => {
    await seed(BLOCK, block());
    await assertSucceeds(getDoc(doc(as('bob'), BLOCK)));
  });

  test('a user updates their own Free_Busy block', async () => {
    await seed(BLOCK, block());
    await assertSucceeds(
      updateDoc(doc(as('alice'), BLOCK), {
        end_time: Timestamp.fromMillis(1_800_007_200_000),
      }),
    );
  });

  test('a user deletes their own Free_Busy block', async () => {
    await seed(BLOCK, block());
    await assertSucceeds(deleteDoc(doc(as('alice'), BLOCK)));
  });
});

describe('denied', () => {
  test('an unauthenticated client reads a Free_Busy block', async () => {
    await seed(BLOCK, block());
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, BLOCK)));
  });

  test("another user creates a block in someone else's Free_Busy", async () => {
    await assertFails(setDoc(doc(as('bob'), BLOCK), block()));
  });

  test("another user updates a block in someone else's Free_Busy", async () => {
    await seed(BLOCK, block());
    await assertFails(
      updateDoc(doc(as('bob'), BLOCK), {
        end_time: Timestamp.fromMillis(1_800_007_200_000),
      }),
    );
  });

  test("another user deletes a block in someone else's Free_Busy", async () => {
    await seed(BLOCK, block());
    await assertFails(deleteDoc(doc(as('bob'), BLOCK)));
  });

  // Open read is only acceptable while a block carries nothing but its times.
  test('a user writes an undeclared field onto their own Free_Busy block', async () => {
    await assertFails(
      setDoc(doc(as('alice'), BLOCK), { ...block(), title: 'Dentist' }),
    );
  });
});

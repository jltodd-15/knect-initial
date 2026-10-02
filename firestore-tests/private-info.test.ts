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

// Users/{userId}/Private_info/main: owner-only, nine schema fields, and the document ID is
// pinned to the literal `main` (ticket 3.2).

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-private-info',
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

const MAIN = 'Users/alice/Private_info/main';
const privateInfoDoc = {
  email: 'alice@example.com',
  blocked_users: [],
  fcm_tokens: [],
};

describe('allowed', () => {
  test('a user creates their own Private_info/main', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), MAIN), privateInfoDoc));
  });

  test('a user reads their own Private_info/main', async () => {
    await seed(MAIN, privateInfoDoc);
    await assertSucceeds(getDoc(doc(as('alice'), MAIN)));
  });

  test('a user updates a declared field on their own Private_info/main', async () => {
    await seed(MAIN, privateInfoDoc);
    await assertSucceeds(
      updateDoc(doc(as('alice'), MAIN), { liked_activity_ids: ['activity-1'] }),
    );
  });

  test('a user deletes their own Private_info/main', async () => {
    await seed(MAIN, privateInfoDoc);
    await assertSucceeds(deleteDoc(doc(as('alice'), MAIN)));
  });
});

describe('denied', () => {
  test("another user reads someone else's Private_info/main", async () => {
    await seed(MAIN, privateInfoDoc);
    await assertFails(getDoc(doc(as('bob'), MAIN)));
  });

  test("another user creates someone else's Private_info/main", async () => {
    await assertFails(setDoc(doc(as('bob'), MAIN), privateInfoDoc));
  });

  test("another user updates someone else's Private_info/main", async () => {
    await seed(MAIN, privateInfoDoc);
    await assertFails(
      updateDoc(doc(as('bob'), MAIN), { blocked_users: ['alice'] }),
    );
  });

  test("another user deletes someone else's Private_info/main", async () => {
    await seed(MAIN, privateInfoDoc);
    await assertFails(deleteDoc(doc(as('bob'), MAIN)));
  });

  test.each(['role', 'is_admin', 'anything_else'])(
    'a user writes the undeclared field %s onto their own Private_info/main',
    async field => {
      await seed(MAIN, privateInfoDoc);
      await assertFails(updateDoc(doc(as('alice'), MAIN), { [field]: true }));
    },
  );

  // The document ID is pinned: a second Private_info document that nothing reads is denied
  // rather than quietly created.
  test('a user writes to their own Private_info/not_main', async () => {
    await assertFails(
      setDoc(
        doc(as('alice'), 'Users/alice/Private_info/not_main'),
        privateInfoDoc,
      ),
    );
  });

  test('a user reads their own Private_info/not_main', async () => {
    await seed('Users/alice/Private_info/not_main', privateInfoDoc);
    await assertFails(
      getDoc(doc(as('alice'), 'Users/alice/Private_info/not_main')),
    );
  });
});

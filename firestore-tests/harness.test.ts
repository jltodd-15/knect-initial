/// <reference types="node" />
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc } from 'firebase/firestore';

// Proves the harness works end to end: one deny and one allow, so a harness that
// silently passes everything is caught. The real rules suite is the other files here
// (ticket 3.2) and ticket 3.3.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // `demo-` project IDs never reach a real Firebase project.
    projectId: 'demo-knect',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test('a signed-in user is denied a collection no rule covers', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(db, 'SomeCollectionThatDoesNotExist/doc')));
});

test('a signed-in admin can read a Users document', async () => {
  // Rowy's catch-all grants ADMIN/OWNER roles everything. Ordinary users' access to
  // Users is covered in users.test.ts (ticket 3.2).
  const db = testEnv
    .authenticatedContext('alice', { roles: ['ADMIN'] })
    .firestore();
  await assertSucceeds(getDoc(doc(db, 'Users/alice')));
});

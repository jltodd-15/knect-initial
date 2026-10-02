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
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

// Users/{userId}: readable by every signed-in user, writable only by its owner, and only with
// the eight schema fields (ticket 3.2).

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: Jest runs the files in parallel against one emulator, and a
    // shared ID would let this file's clearFirestore() wipe another file's data mid-test.
    projectId: 'demo-knect-users',
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

// Exactly what services/UsersRepository.ts writes at signup (ticket 2.2).
const signupUserDoc = {
  name: 'Alice Example',
  name_lowercase: 'alice example',
  profile_info: 'Climber',
  profile_picture_url: '',
  interests: ['Hiking', 'Coffee'],
};
const signupPrivateInfoDoc = {
  email: 'alice@example.com',
  blocked_users: [],
  fcm_tokens: [],
};

describe('allowed', () => {
  test("a signed-in user reads another user's Users document", async () => {
    await seed('Users/alice', signupUserDoc);
    await assertSucceeds(getDoc(doc(as('bob'), 'Users/alice')));
  });

  test("signup's two-document batch from ticket 2.2 is accepted", async () => {
    const db = as('alice');
    const batch = writeBatch(db);
    batch.set(doc(db, 'Users/alice'), signupUserDoc);
    batch.set(doc(db, 'Users/alice/Private_info/main'), signupPrivateInfoDoc);
    await assertSucceeds(batch.commit());
  });

  test('a user updates current_status on their own document', async () => {
    await seed('Users/alice', signupUserDoc);
    await assertSucceeds(
      updateDoc(doc(as('alice'), 'Users/alice'), { current_status: 'Free' }),
    );
  });

  test('a user deletes their own document', async () => {
    await seed('Users/alice', signupUserDoc);
    await assertSucceeds(deleteDoc(doc(as('alice'), 'Users/alice')));
  });
});

describe('denied', () => {
  test('an unauthenticated client reads a Users document', async () => {
    await seed('Users/alice', signupUserDoc);
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'Users/alice')));
  });

  test("another user creates someone else's Users document", async () => {
    await assertFails(setDoc(doc(as('bob'), 'Users/alice'), signupUserDoc));
  });

  test("another user updates someone else's Users document", async () => {
    await seed('Users/alice', signupUserDoc);
    await assertFails(
      updateDoc(doc(as('bob'), 'Users/alice'), { name: 'Hacked' }),
    );
  });

  test("another user deletes someone else's Users document", async () => {
    await seed('Users/alice', signupUserDoc);
    await assertFails(deleteDoc(doc(as('bob'), 'Users/alice')));
  });

  test('a user creates their own Users document carrying email', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'Users/alice'), {
        ...signupUserDoc,
        email: 'alice@example.com',
      }),
    );
  });

  test('a user adds email to their own Users document', async () => {
    await seed('Users/alice', signupUserDoc);
    await assertFails(
      updateDoc(doc(as('alice'), 'Users/alice'), {
        email: 'alice@example.com',
      }),
    );
  });

  test.each(['role', 'is_admin', 'anything_else'])(
    'a user writes the undeclared field %s onto their own Users document',
    async field => {
      await seed('Users/alice', signupUserDoc);
      await assertFails(
        updateDoc(doc(as('alice'), 'Users/alice'), { [field]: true }),
      );
    },
  );
});

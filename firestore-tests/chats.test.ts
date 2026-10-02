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
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

// Chats/{chatId} (ticket 3.3). A participant may read the chat, rename it, add anyone, and remove
// only themselves. participant_hash and chat_origin are set at creation and never again from a
// client; the recent_message preview fields are written only by the Admin SDK. No client deletes a
// chat: that is inherited from the old published rule, not decided here.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-chats',
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

const CHAT = 'Chats/chat-1';
const newChat = {
  participants: ['alice', 'bob', 'carol'],
  participant_hash: 'alice_bob_carol',
  chat_origin: 'direct',
  chat_name: 'Weekend plans',
};
// As it looks once the Admin SDK has written a preview.
const existingChat = {
  ...newChat,
  recent_message: 'See you there',
  recent_message_timestamp: Timestamp.fromMillis(1_800_000_000_000),
  recent_message_sender_id: 'bob',
};

describe('allowed', () => {
  test('a user creates a chat that includes their own UID', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), CHAT), newChat));
  });

  test('a participant reads the chat', async () => {
    await seed(CHAT, existingChat);
    await assertSucceeds(getDoc(doc(as('alice'), CHAT)));
  });

  test('a participant renames the chat', async () => {
    await seed(CHAT, existingChat);
    await assertSucceeds(
      updateDoc(doc(as('alice'), CHAT), { chat_name: 'Saturday' }),
    );
  });

  test('a participant adds someone', async () => {
    await seed(CHAT, existingChat);
    await assertSucceeds(
      updateDoc(doc(as('alice'), CHAT), { participants: arrayUnion('dave') }),
    );
  });

  test('a participant removes themselves', async () => {
    await seed(CHAT, existingChat);
    await assertSucceeds(
      updateDoc(doc(as('alice'), CHAT), { participants: arrayRemove('alice') }),
    );
  });
});

describe('denied', () => {
  test('a user creates a chat that does not include them', async () => {
    await assertFails(
      setDoc(doc(as('dave'), CHAT), newChat),
    );
  });

  test('a user creates a chat carrying a recent_message preview', async () => {
    await assertFails(setDoc(doc(as('alice'), CHAT), existingChat));
  });

  test('a non-participant reads the chat', async () => {
    await seed(CHAT, existingChat);
    await assertFails(getDoc(doc(as('dave'), CHAT)));
  });

  test('a participant removes someone else', async () => {
    await seed(CHAT, existingChat);
    await assertFails(
      updateDoc(doc(as('alice'), CHAT), { participants: arrayRemove('bob') }),
    );
  });

  test('a participant removes themselves and someone else in one write', async () => {
    await seed(CHAT, existingChat);
    await assertFails(
      updateDoc(doc(as('alice'), CHAT), {
        participants: arrayRemove('alice', 'bob'),
      }),
    );
  });

  test('a non-participant renames the chat', async () => {
    await seed(CHAT, existingChat);
    await assertFails(
      updateDoc(doc(as('dave'), CHAT), { chat_name: 'Mine now' }),
    );
  });

  test('a non-participant adds themselves', async () => {
    await seed(CHAT, existingChat);
    await assertFails(
      updateDoc(doc(as('dave'), CHAT), { participants: arrayUnion('dave') }),
    );
  });

  test.each([
    ['recent_message', 'Forged preview'],
    ['recent_message_timestamp', Timestamp.fromMillis(1_900_000_000_000)],
    ['recent_message_sender_id', 'alice'],
    ['participant_hash', 'alice_bob'],
    ['chat_origin', 'activity'],
  ])('a participant writes %s', async (field, value) => {
    await seed(CHAT, existingChat);
    await assertFails(updateDoc(doc(as('alice'), CHAT), { [field]: value }));
  });

  test('a participant deletes the chat', async () => {
    await seed(CHAT, existingChat);
    await assertFails(deleteDoc(doc(as('alice'), CHAT)));
  });
});

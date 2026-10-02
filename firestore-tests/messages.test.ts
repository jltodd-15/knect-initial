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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

// Chats/{chatId}/Messages/{messageId} (ticket 3.3). Secured by membership in the parent chat,
// which costs a get() on Chats/{chatId}. A sender may create a message as themselves only, up to
// 2,000 characters, of one of four types. The only edit is a tombstone: text cleared, deleted_at
// stamped with the server time. Nothing deletes a message.
//
// Blocking is NOT enforced here and must never be described as enforced. A blocked user's
// messages are still created and delivered; 15.2's receive-side filter hides them.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // One project ID per test file: see users.test.ts.
    projectId: 'demo-knect-messages',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed(CHAT, { participants: ['alice', 'bob'], chat_name: 'Plans' });
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
const MESSAGE = `${CHAT}/Messages/msg-1`;
const sentAt = Timestamp.fromMillis(1_800_000_000_000);
const aliceMessage = {
  sender_id: 'alice',
  text: 'Bowling Friday?',
  timestamp: sentAt,
  message_type: 'text',
};

describe('allowed', () => {
  test('a participant creates a text message of exactly 2,000 characters', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), MESSAGE), {
        ...aliceMessage,
        text: 'a'.repeat(2000),
      }),
    );
  });

  test.each(['activity', 'event_proposal', 'vote'])(
    'a participant creates a "%s" message',
    async messageType => {
      await assertSucceeds(
        setDoc(doc(as('alice'), MESSAGE), {
          ...aliceMessage,
          message_type: messageType,
        }),
      );
    },
  );

  // A card message may leave text out: a missing text counts as empty.
  test('a participant creates an activity card with no text field', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), MESSAGE), {
        sender_id: 'alice',
        timestamp: sentAt,
        message_type: 'activity',
        activity_id: 'activity-1',
      }),
    );
  });

  test('a participant reads a 25-message page of the thread', async () => {
    for (let i = 0; i < 25; i++) {
      await seed(`${CHAT}/Messages/msg-${i}`, {
        ...aliceMessage,
        timestamp: Timestamp.fromMillis(1_800_000_000_000 + i),
      });
    }
    const page = query(
      collection(as('bob'), `${CHAT}/Messages`),
      orderBy('timestamp', 'desc'),
      limit(25),
    );
    const snapshot = await assertSucceeds(getDocs(page));
    expect(snapshot.size).toBe(25);
  });

  test('a participant tombstones their own message, and the document survives', async () => {
    await seed(MESSAGE, aliceMessage);
    await assertSucceeds(
      updateDoc(doc(as('alice'), MESSAGE), {
        text: '',
        deleted_at: serverTimestamp(),
      }),
    );
    // withSecurityRulesDisabled discards its callback's return value, so read into a local.
    let after: Record<string, unknown> | undefined;
    await testEnv.withSecurityRulesDisabled(async context => {
      after = (await getDoc(doc(context.firestore(), MESSAGE))).data();
    });
    expect(after?.text).toBe('');
    expect(after?.deleted_at).toBeInstanceOf(Timestamp);
  });
});

describe('denied', () => {
  test('a non-participant reads a message', async () => {
    await seed(MESSAGE, aliceMessage);
    await assertFails(getDoc(doc(as('dave'), MESSAGE)));
  });

  test('a non-participant creates a message', async () => {
    await assertFails(
      setDoc(doc(as('dave'), MESSAGE), { ...aliceMessage, sender_id: 'dave' }),
    );
  });

  test("a participant creates a message with someone else's sender_id", async () => {
    await assertFails(setDoc(doc(as('bob'), MESSAGE), aliceMessage));
  });

  test('a message of 2,001 characters', async () => {
    await assertFails(
      setDoc(doc(as('alice'), MESSAGE), {
        ...aliceMessage,
        text: 'a'.repeat(2001),
      }),
    );
  });

  test.each(['system', 'image', ''])(
    'a message with message_type "%s"',
    async messageType => {
      await assertFails(
        setDoc(doc(as('alice'), MESSAGE), {
          ...aliceMessage,
          message_type: messageType,
        }),
      );
    },
  );

  test('a message created carrying deleted_at', async () => {
    await assertFails(
      setDoc(doc(as('alice'), MESSAGE), {
        ...aliceMessage,
        deleted_at: serverTimestamp(),
      }),
    );
  });

  test('a message created carrying a field outside the schema', async () => {
    await assertFails(
      setDoc(doc(as('alice'), MESSAGE), { ...aliceMessage, pinned: true }),
    );
  });

  test("a participant tombstones someone else's message", async () => {
    await seed(MESSAGE, aliceMessage);
    await assertFails(
      updateDoc(doc(as('bob'), MESSAGE), {
        text: '',
        deleted_at: serverTimestamp(),
      }),
    );
  });

  test('the sender deletes their own message', async () => {
    await seed(MESSAGE, aliceMessage);
    await assertFails(deleteDoc(doc(as('alice'), MESSAGE)));
  });

  test("a participant deletes someone else's message", async () => {
    await seed(MESSAGE, aliceMessage);
    await assertFails(deleteDoc(doc(as('bob'), MESSAGE)));
  });

  test('the sender edits their text to anything other than ""', async () => {
    await seed(MESSAGE, aliceMessage);
    await assertFails(
      updateDoc(doc(as('alice'), MESSAGE), {
        text: 'Bowling Saturday?',
        deleted_at: serverTimestamp(),
      }),
    );
  });

  test('the sender tombstones with a client-chosen deleted_at', async () => {
    await seed(MESSAGE, aliceMessage);
    await assertFails(
      updateDoc(doc(as('alice'), MESSAGE), { text: '', deleted_at: sentAt }),
    );
  });
});

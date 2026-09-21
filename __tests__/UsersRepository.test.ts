/**
 * Ticket 2.2: the Users creation write.
 *
 * Firestore's native module doesn't exist under Jest, so the SDK is mocked. These tests pin the
 * shape and atomicity of the write: two documents, one batch, one commit, exactly the fields the
 * ticket lists. Whether the documents actually land in the Console (and land together while
 * offline) is only provable on a device.
 */

const mockDb = {__brand: 'firestore-instance'};
// Every call, in order, so a test can prove the commit came after both sets.
const mockCalls: string[] = [];
const mockSet = jest.fn();
const mockCommit = jest.fn();
const mockWriteBatch = jest.fn();
const mockDoc = jest.fn();

jest.mock('@react-native-firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
}));
// A getter, so `mockDb` is read when the code under test uses `db`, not when this factory runs
// (the import below is hoisted above the const, which would otherwise hand out undefined).
jest.mock('../services/firestore', () => ({
  get db() {
    return mockDb;
  },
}));

import {UsersRepository} from '../services/UsersRepository';

const profile = {
  name: 'John Smith',
  role: 'DIGITAL NOMAD • SAN FRANCISCO',
  interests: ['Board games', 'HIKING', 'coffee'],
  email: 'john@example.com',
};

// The refs are opaque to the code under test; represent each by its path so tests can read them.
const setCallFor = (path: string) => mockSet.mock.calls.find(([ref]) => ref.path === path);

beforeEach(() => {
  jest.clearAllMocks();
  mockCalls.length = 0;
  mockDoc.mockImplementation((_db: unknown, ...segments: string[]) => ({path: segments.join('/')}));
  mockSet.mockImplementation(() => {
    mockCalls.push('set');
  });
  mockCommit.mockImplementation(async () => {
    mockCalls.push('commit');
  });
  mockWriteBatch.mockImplementation(() => ({set: mockSet, commit: mockCommit}));
});

test('writes Users/{uid} and Users/{uid}/Private_info/main, with the document ID "main" literal', async () => {
  await UsersRepository.createUserDocuments('uid-123', profile);

  expect(mockSet).toHaveBeenCalledTimes(2);
  expect(setCallFor('Users/uid-123')).toBeDefined();
  expect(setCallFor('Users/uid-123/Private_info/main')).toBeDefined();
});

test('uses the shared db instance, in one batch with one commit after both sets', async () => {
  await UsersRepository.createUserDocuments('uid-123', profile);

  expect(mockWriteBatch).toHaveBeenCalledTimes(1);
  expect(mockWriteBatch).toHaveBeenCalledWith(mockDb);
  expect(mockCommit).toHaveBeenCalledTimes(1);
  expect(mockCalls).toEqual(['set', 'set', 'commit']);
});

test('the Users document has exactly the five schema fields and nothing else', async () => {
  await UsersRepository.createUserDocuments('uid-123', profile);

  const data = setCallFor('Users/uid-123')?.[1];
  expect(Object.keys(data).sort()).toEqual(
    ['interests', 'name', 'name_lowercase', 'profile_info', 'profile_picture_url'],
  );
});

test('name_lowercase is computed at write time and stored alongside the original name', async () => {
  await UsersRepository.createUserDocuments('uid-123', profile);

  const data = setCallFor('Users/uid-123')?.[1];
  expect(data.name).toBe('John Smith');
  expect(data.name_lowercase).toBe('john smith');
});

test('role is written as profile_info, and profile_picture_url is an empty string', async () => {
  await UsersRepository.createUserDocuments('uid-123', profile);

  const data = setCallFor('Users/uid-123')?.[1];
  expect(data.profile_info).toBe('DIGITAL NOMAD • SAN FRANCISCO');
  expect(data.profile_picture_url).toBe('');
  expect(data).not.toHaveProperty('role');
});

test('interests are written verbatim as an array: no case or spacing normalization', async () => {
  await UsersRepository.createUserDocuments('uid-123', profile);

  const data = setCallFor('Users/uid-123')?.[1];
  expect(Array.isArray(data.interests)).toBe(true);
  expect(data.interests).toEqual(['Board games', 'HIKING', 'coffee']);
});

test('the Users document carries no email and none of the three status fields', async () => {
  await UsersRepository.createUserDocuments('uid-123', profile);

  const data = setCallFor('Users/uid-123')?.[1];
  for (const field of ['email', 'current_status', 'status_visibility', 'status_expires_at']) {
    expect(data).not.toHaveProperty(field);
  }
});

test('Private_info/main has exactly email plus two empty arrays', async () => {
  await UsersRepository.createUserDocuments('uid-123', profile);

  const data = setCallFor('Users/uid-123/Private_info/main')?.[1];
  expect(Object.keys(data).sort()).toEqual(['blocked_users', 'email', 'fcm_tokens']);
  expect(data.email).toBe('john@example.com');
  expect(data.blocked_users).toEqual([]);
  expect(data.fcm_tokens).toEqual([]);
});

test('a password on the input never reaches either document', async () => {
  // Callers hand over the whole signup payload; the repository must not forward what it wasn't
  // asked to write. Cast because NewUserProfile deliberately has no password field.
  const withPassword = {...profile, password: 'hunter2-Secret', avatar: 'data:image/png;base64,AAAA'};
  await UsersRepository.createUserDocuments('uid-123', withPassword as typeof profile);

  // Both documents must actually have been written, or the checks below pass vacuously.
  expect(mockSet).toHaveBeenCalledTimes(2);
  const written = JSON.stringify(mockSet.mock.calls.map(([, data]) => data));
  expect(written).not.toContain('hunter2-Secret');
  expect(written).not.toContain('password');
  expect(written).not.toContain('avatar');
});

test('a failed commit rejects, so the caller can see the write did not land', async () => {
  mockCommit.mockRejectedValueOnce(new Error('commit failed'));

  await expect(UsersRepository.createUserDocuments('uid-123', profile)).rejects.toThrow('commit failed');
});

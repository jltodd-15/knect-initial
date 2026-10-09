/**
 * Ticket 4.4: the session name cache.
 *
 * Firestore's native module doesn't exist under Jest, so the SDK is mocked. These tests pin what
 * the cache is for: one Users read per person per session, a fresh start when someone else signs
 * in, and a way to throw it all away (pull to refresh).
 */

const mockDb = {__brand: 'firestore-instance'};
const mockGetDoc = jest.fn();
let mockCurrentUser: {uid: string} | null = {uid: 'me'};

jest.mock('@react-native-firebase/firestore', () => ({
  doc: (db: unknown, ...path: string[]) => ({db, path: path.join('/')}),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({
    get currentUser() {
      return mockCurrentUser;
    },
  }),
}));
jest.mock('../services/firestore', () => ({
  get db() {
    return mockDb;
  },
}));

import {userProfileCache} from '../services/userProfileCache';

const userSnapshot = (name: string) => ({
  exists: () => true,
  data: () => ({name, name_lowercase: name.toLowerCase(), profile_info: '', profile_picture_url: '', interests: []}),
});
const missingSnapshot = {exists: () => false, data: () => undefined};

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = {uid: 'me'};
  userProfileCache.clear();
  mockGetDoc.mockResolvedValue(userSnapshot('Ana Diaz'));
});

test('the first load reads Users/{uid} through the shared db and keeps name and name_lowercase', async () => {
  await expect(userProfileCache.get('ana')).resolves.toEqual({name: 'Ana Diaz', name_lowercase: 'ana diaz'});

  expect(mockGetDoc).toHaveBeenCalledTimes(1);
  expect(mockGetDoc.mock.calls[0][0]).toEqual({db: mockDb, path: 'Users/ana'});
});

test('a second load of the same person makes no new Users read', async () => {
  await userProfileCache.get('ana');
  await expect(userProfileCache.get('ana')).resolves.toEqual({name: 'Ana Diaz', name_lowercase: 'ana diaz'});

  expect(mockGetDoc).toHaveBeenCalledTimes(1);
});

test('two loads of the same person at the same moment share one read', async () => {
  await Promise.all([userProfileCache.get('ana'), userProfileCache.get('ana')]);

  expect(mockGetDoc).toHaveBeenCalledTimes(1);
});

test('after the cache is cleared, the same person is read again', async () => {
  await userProfileCache.get('ana');
  userProfileCache.clear();
  await userProfileCache.get('ana');

  expect(mockGetDoc).toHaveBeenCalledTimes(2);
});

test('the cache starts empty when the signed-in uid changes', async () => {
  await userProfileCache.get('ana');

  mockCurrentUser = {uid: 'someone-else'};
  await userProfileCache.get('ana');

  expect(mockGetDoc).toHaveBeenCalledTimes(2);
});

test('signing out and back in as the same person also starts empty', async () => {
  await userProfileCache.get('ana');

  mockCurrentUser = null;
  await userProfileCache.get('ana');
  mockCurrentUser = {uid: 'me'};
  await userProfileCache.get('ana');

  expect(mockGetDoc).toHaveBeenCalledTimes(3);
});

test('a person with no Users document is null, and that answer is remembered too', async () => {
  mockGetDoc.mockResolvedValue(missingSnapshot);

  await expect(userProfileCache.get('gone')).resolves.toBeNull();
  await expect(userProfileCache.get('gone')).resolves.toBeNull();

  expect(mockGetDoc).toHaveBeenCalledTimes(1);
});

test('a failed read rejects and is not remembered: the next load tries again', async () => {
  mockGetDoc.mockRejectedValueOnce(new Error('unavailable'));

  await expect(userProfileCache.get('ana')).rejects.toThrow('unavailable');
  await expect(userProfileCache.get('ana')).resolves.toEqual({name: 'Ana Diaz', name_lowercase: 'ana diaz'});

  expect(mockGetDoc).toHaveBeenCalledTimes(2);
});

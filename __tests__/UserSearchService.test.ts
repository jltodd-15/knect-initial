/**
 * Ticket 4.3: the Firestore wrapper around the search logic.
 *
 * Firestore's native module doesn't exist under Jest, so the SDK is mocked. These tests pin the
 * shape of the one read: the Users collection, a range on the stored name_lowercase field, a
 * limit of 10, and the signed-in user taken out afterwards. Whether the query actually finds
 * people is only provable on a device (DEVICE_TESTS.md, 4.3).
 */

const mockDb = {__brand: 'firestore-instance'};
const mockGetDocs = jest.fn();
let mockCurrentUser: {uid: string} | null = {uid: 'me'};

jest.mock('@react-native-firebase/firestore', () => ({
  collection: (db: unknown, path: string) => ({db, path}),
  where: (field: string, op: string, value: string) => ({type: 'where', field, op, value}),
  limit: (count: number) => ({type: 'limit', count}),
  query: (source: unknown, ...constraints: unknown[]) => ({source, constraints}),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}));
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({
    get currentUser() {
      return mockCurrentUser;
    },
  }),
}));
// A getter, so `mockDb` is read when the code under test uses `db`, not when this factory runs.
jest.mock('../services/firestore', () => ({
  get db() {
    return mockDb;
  },
}));

import {UserSearchService} from '../services/UserSearchService';

const snapshotOf = (docs: {id: string; name: string}[]) => ({
  docs: docs.map(({id, name}) => ({
    id,
    data: () => ({name, name_lowercase: name.toLowerCase(), profile_info: '', profile_picture_url: '', interests: []}),
  })),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = {uid: 'me'};
  mockGetDocs.mockResolvedValue(snapshotOf([]));
});

test('reads Users through the shared db, exactly once', async () => {
  await UserSearchService.searchUsers('kys');

  expect(mockGetDocs).toHaveBeenCalledTimes(1);
  expect(mockGetDocs.mock.calls[0][0].source).toEqual({db: mockDb, path: 'Users'});
});

test('the query is a range on name_lowercase with a limit of 10, and nothing else', async () => {
  await UserSearchService.searchUsers('KYS');

  expect(mockGetDocs.mock.calls[0][0].constraints).toEqual([
    {type: 'where', field: 'name_lowercase', op: '>=', value: 'kys'},
    {type: 'where', field: 'name_lowercase', op: '<', value: 'kys'},
    {type: 'limit', count: 10},
  ]);
});

test('each result is the document ID and the name as stored, capitals intact', async () => {
  mockGetDocs.mockResolvedValue(snapshotOf([{id: 'a', name: 'Kyson A'}, {id: 'b', name: 'KYSON B'}]));

  await expect(UserSearchService.searchUsers('kys')).resolves.toEqual([
    {uid: 'a', name: 'Kyson A'},
    {uid: 'b', name: 'KYSON B'},
  ]);
});

test('the signed-in user is left out of their own results', async () => {
  mockGetDocs.mockResolvedValue(snapshotOf([{id: 'a', name: 'Kyson A'}, {id: 'me', name: 'Kyson Childs'}]));

  await expect(UserSearchService.searchUsers('kys')).resolves.toEqual([{uid: 'a', name: 'Kyson A'}]);
});

test('a failed read rejects, so the screen can show the error state', async () => {
  mockGetDocs.mockRejectedValueOnce(new Error('unavailable'));

  await expect(UserSearchService.searchUsers('kys')).rejects.toThrow('unavailable');
});

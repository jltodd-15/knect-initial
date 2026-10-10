/**
 * Ticket 4.4: the two reads behind the Friends and Pending Requests sections.
 *
 * The SDK and the name cache are mocked. These tests pin the shape of each query (the signed-in
 * user's own Friends subcollection, filtered by status, read once) and that names come from the
 * cache. Whether the real queries return the real documents is only provable on a device
 * (DEVICE_TESTS.md, 4.4).
 */

const mockDb = {__brand: 'firestore-instance'};
const mockGetDocs = jest.fn();
const mockGetCount = jest.fn();
const mockCacheGet = jest.fn();
let mockCurrentUser: {uid: string} | null = {uid: 'me'};

jest.mock('@react-native-firebase/firestore', () => ({
  collection: (db: unknown, ...path: string[]) => ({db, path: path.join('/')}),
  where: (field: string, op: string, value: unknown) => ({type: 'where', field, op, value}),
  query: (source: unknown, ...constraints: unknown[]) => ({source, constraints}),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getCountFromServer: (...args: unknown[]) => mockGetCount(...args),
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
jest.mock('../services/userProfileCache', () => ({
  userProfileCache: {get: (...args: unknown[]) => mockCacheGet(...args), clear: jest.fn()},
}));

import {FriendsService} from '../services/FriendsService';

const snapshotOf = (docs: {id: string; status: string}[]) => ({
  docs: docs.map(({id, status}) => ({id, data: () => ({status})})),
});
const NAMES: Record<string, string> = {a: 'Ana', b: 'bob', c: 'Carol'};

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = {uid: 'me'};
  mockGetDocs.mockResolvedValue(snapshotOf([]));
  mockCacheGet.mockImplementation(async (uid: string) =>
    NAMES[uid] ? {name: NAMES[uid], name_lowercase: NAMES[uid].toLowerCase()} : null,
  );
});

test('friends: one query of my own Friends, status "friend" or "close_friend"', async () => {
  await FriendsService.getFriends();

  expect(mockGetDocs).toHaveBeenCalledTimes(1);
  expect(mockGetDocs.mock.calls[0][0]).toEqual({
    source: {db: mockDb, path: 'Users/me/Friends'},
    constraints: [{type: 'where', field: 'status', op: 'in', value: ['friend', 'close_friend']}],
  });
});

test('pending: one query of my own Friends, status "pending"', async () => {
  await FriendsService.getPendingRequests();

  expect(mockGetDocs).toHaveBeenCalledTimes(1);
  expect(mockGetDocs.mock.calls[0][0]).toEqual({
    source: {db: mockDb, path: 'Users/me/Friends'},
    constraints: [{type: 'where', field: 'status', op: '==', value: 'pending'}],
  });
});

test('friends come back as rows: named from the cache, close friends first, then alphabetical', async () => {
  mockGetDocs.mockResolvedValue(
    snapshotOf([
      {id: 'b', status: 'friend'},
      {id: 'c', status: 'close_friend'},
      {id: 'a', status: 'friend'},
    ]),
  );

  const rows = await FriendsService.getFriends();

  expect(rows.map(row => [row.uid, row.name, row.status])).toEqual([
    ['c', 'Carol', 'close_friend'],
    ['a', 'Ana', 'friend'],
    ['b', 'bob', 'friend'],
  ]);
  expect(mockCacheGet.mock.calls.map(call => call[0]).sort()).toEqual(['a', 'b', 'c']);
});

test('pending requests come back as rows, alphabetical', async () => {
  mockGetDocs.mockResolvedValue(snapshotOf([{id: 'b', status: 'pending'}, {id: 'a', status: 'pending'}]));

  const rows = await FriendsService.getPendingRequests();

  expect(rows.map(row => row.name)).toEqual(['Ana', 'bob']);
});

test('a friend whose Users document is gone becomes "Deleted user", last', async () => {
  mockGetDocs.mockResolvedValue(snapshotOf([{id: 'gone', status: 'close_friend'}, {id: 'a', status: 'friend'}]));

  const rows = await FriendsService.getFriends();

  expect(rows.map(row => row.name)).toEqual(['Ana', 'Deleted user']);
});

test('a document the query should not have returned is dropped, not shown', async () => {
  mockGetDocs.mockResolvedValue(snapshotOf([{id: 'a', status: 'request_sent'}, {id: 'b', status: 'friend'}]));

  const rows = await FriendsService.getFriends();

  expect(rows.map(row => row.uid)).toEqual(['b']);
});

test('a failed query rejects, so the section can show the error state', async () => {
  mockGetDocs.mockRejectedValueOnce(new Error('unavailable'));

  await expect(FriendsService.getFriends()).rejects.toThrow('unavailable');
});

test('a failed name read rejects too: a half-named list is not shown', async () => {
  mockGetDocs.mockResolvedValue(snapshotOf([{id: 'a', status: 'friend'}]));
  mockCacheGet.mockRejectedValueOnce(new Error('unavailable'));

  await expect(FriendsService.getFriends()).rejects.toThrow('unavailable');
});

test('with nobody signed in, both reads reject without asking Firestore anything', async () => {
  mockCurrentUser = null;

  await expect(FriendsService.getFriends()).rejects.toThrow();
  await expect(FriendsService.getPendingRequests()).rejects.toThrow();
  expect(mockGetDocs).not.toHaveBeenCalled();
});

// Ticket 4.6: the Friends box's two numbers come from count queries, not from reading friends.
describe('friend counts (ticket 4.6)', () => {
  const countOf = (count: number) => ({data: () => ({count})});
  const isCloseOnly = (q: {constraints: {op: string}[]}) => q.constraints[0].op === '==';

  beforeEach(() => {
    mockGetCount.mockImplementation(async q => countOf(isCloseOnly(q) ? 2 : 12));
  });

  test('two count queries of my own Friends: all friends, and close friends', async () => {
    const counts = await FriendsService.getFriendCounts();

    expect(counts).toEqual({friends: 12, closeFriends: 2});
    expect(mockGetCount).toHaveBeenCalledTimes(2);
    expect(mockGetCount.mock.calls.map(call => call[0])).toEqual(
      expect.arrayContaining([
        {
          source: {db: mockDb, path: 'Users/me/Friends'},
          constraints: [{type: 'where', field: 'status', op: 'in', value: ['friend', 'close_friend']}],
        },
        {
          source: {db: mockDb, path: 'Users/me/Friends'},
          constraints: [{type: 'where', field: 'status', op: '==', value: 'close_friend'}],
        },
      ]),
    );
  });

  test('counting reads no Friends documents and no names', async () => {
    await FriendsService.getFriendCounts();

    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(mockCacheGet).not.toHaveBeenCalled();
  });

  test('a failed count rejects, so the box can show without numbers', async () => {
    mockGetCount.mockRejectedValue(new Error('unavailable'));

    await expect(FriendsService.getFriendCounts()).rejects.toThrow('unavailable');
  });

  test('with nobody signed in, counting rejects without asking Firestore anything', async () => {
    mockCurrentUser = null;

    await expect(FriendsService.getFriendCounts()).rejects.toThrow();
    expect(mockGetCount).not.toHaveBeenCalled();
  });
});

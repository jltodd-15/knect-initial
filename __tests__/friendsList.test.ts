/**
 * Ticket 4.4: the friends list's logic, with no Firestore and no React.
 *
 * Which section a Friends document lands in, the order of the rows, the badge's number and what a
 * person who no longer exists turns into. The Firestore wrapper and the two sections only wire
 * these functions together.
 */

import {
  DELETED_USER_NAME,
  PAGE_SIZE,
  FriendEntry,
  badgeCount,
  isStarFilled,
  pageOf,
  sortFriends,
  sortPending,
  splitByStatus,
  toRow, friendCountsLabel} from '../services/friendsList';

const profile = (name: string) => ({name, name_lowercase: name.toLowerCase()});

// One Friends document per status, as the ticket's fixture.
const ONE_OF_EACH: FriendEntry[] = [
  {uid: 'sent', status: 'request_sent'},
  {uid: 'pending', status: 'pending'},
  {uid: 'friend', status: 'friend'},
  {uid: 'close', status: 'close_friend'},
];

test('one document per status gives exactly one Pending row and exactly two Friends rows', () => {
  const {pending, friends} = splitByStatus(ONE_OF_EACH);

  expect(pending.map(entry => entry.uid)).toEqual(['pending']);
  expect(friends.map(entry => entry.uid).sort()).toEqual(['close', 'friend']);
});

test('a request you sent is in neither section', () => {
  const {pending, friends} = splitByStatus([{uid: 'sent', status: 'request_sent'}]);

  expect(pending).toEqual([]);
  expect(friends).toEqual([]);
});

test('status is compared as a string: a boolean or an unknown value lands in neither section', () => {
  const junk = [
    {uid: 'a', status: true},
    {uid: 'b', status: false},
    {uid: 'c', status: 'best_friend'},
    {uid: 'd', status: undefined},
  ] as unknown as FriendEntry[];

  const {pending, friends} = splitByStatus(junk);

  expect(pending).toEqual([]);
  expect(friends).toEqual([]);
});

test('a row carries the name as stored and the status as the string it was read as', () => {
  expect(toRow({uid: 'a', status: 'close_friend'}, profile('Ana Diaz'))).toEqual({
    uid: 'a',
    status: 'close_friend',
    name: 'Ana Diaz',
    avatarName: 'Ana Diaz',
    sortName: 'ana diaz',
    isDeleted: false,
  });
});

test('a Friends document with no Users document becomes "Deleted user", without throwing', () => {
  const row = toRow({uid: 'gone', status: 'friend'}, null);

  expect(DELETED_USER_NAME).toBe('Deleted user');
  expect(row.name).toBe('Deleted user');
  // An empty name is what makes InitialsAvatar draw its person glyph.
  expect(row.avatarName).toBe('');
  expect(row.isDeleted).toBe(true);
});

test('friends: close friends first, then alphabetical by name, ignoring capitalization', () => {
  const rows = [
    toRow({uid: '1', status: 'friend'}, profile('bob')),
    toRow({uid: '2', status: 'close_friend'}, profile('Zed')),
    toRow({uid: '3', status: 'friend'}, profile('Alice')),
    toRow({uid: '4', status: 'close_friend'}, profile('carol')),
    toRow({uid: '5', status: 'friend'}, profile('Dave')),
  ];

  expect(sortFriends(rows).map(row => row.name)).toEqual(['carol', 'Zed', 'Alice', 'bob', 'Dave']);
});

test('friends: a deleted user sorts last, even one starred as a close friend', () => {
  const rows = [
    toRow({uid: 'gone', status: 'close_friend'}, null),
    toRow({uid: '1', status: 'friend'}, profile('Zed')),
    toRow({uid: '2', status: 'close_friend'}, profile('Ana')),
  ];

  expect(sortFriends(rows).map(row => row.name)).toEqual(['Ana', 'Zed', 'Deleted user']);
});

test('pending: alphabetical ignoring capitalization, deleted users last', () => {
  const rows = [
    toRow({uid: 'gone', status: 'pending'}, null),
    toRow({uid: '1', status: 'pending'}, profile('bob')),
    toRow({uid: '2', status: 'pending'}, profile('Alice')),
  ];

  expect(sortPending(rows).map(row => row.name)).toEqual(['Alice', 'bob', 'Deleted user']);
});

test('sorting returns a new list and leaves the one it was given alone', () => {
  const rows = [toRow({uid: '1', status: 'friend'}, profile('b')), toRow({uid: '2', status: 'friend'}, profile('a'))];

  sortFriends(rows);

  expect(rows.map(row => row.name)).toEqual(['b', 'a']);
});

test('only close_friend gets a filled star', () => {
  expect(isStarFilled('close_friend')).toBe(true);
  expect(isStarFilled('friend')).toBe(false);
  expect(isStarFilled('pending')).toBe(false);
  expect(isStarFilled('request_sent')).toBe(false);
});

test('the badge is the number of pending rows, as text', () => {
  const three = ['a', 'b', 'c'].map(uid => toRow({uid, status: 'pending'}, profile(uid)));

  expect(badgeCount(three)).toBe('3');
  expect(badgeCount([])).toBe('0');
});

test('a page is 10 rows; each further page shows 10 more', () => {
  const rows = Array.from({length: 23}, (_, index) => index);

  expect(PAGE_SIZE).toBe(10);
  expect(pageOf(rows, 1)).toEqual({visible: rows.slice(0, 10), hasMore: true});
  expect(pageOf(rows, 2)).toEqual({visible: rows.slice(0, 20), hasMore: true});
  expect(pageOf(rows, 3)).toEqual({visible: rows, hasMore: false});
  expect(pageOf(rows, 9)).toEqual({visible: rows, hasMore: false});
});

// Ticket 4.6: the line under "Friends" in the Search tab's box.
test('the counts line: friends, then close friends', () => {
  expect(friendCountsLabel({friends: 12, closeFriends: 2})).toBe('12 friends · 2 close friends');
});

test('the counts line is singular at one', () => {
  expect(friendCountsLabel({friends: 1, closeFriends: 1})).toBe('1 friend · 1 close friend');
});

test('with no close friends the second half is left off', () => {
  expect(friendCountsLabel({friends: 3, closeFriends: 0})).toBe('3 friends');
});

test('with no friends the counts line says so', () => {
  expect(friendCountsLabel({friends: 0, closeFriends: 0})).toBe('No friends yet');
});

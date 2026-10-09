// Ticket 4.4: the friends list's logic as plain functions. No Firestore and no React in this file,
// so every rule below is tested on its own (__tests__/friendsList.test.ts).
// services/FriendsService.ts is the Firestore wrapper that uses them.

import type {FriendStatus} from '../types';
import type {CachedProfile} from './userProfileCache';

// About a screen's worth plus a few. Paging saves rendering, not reads: sorting by name needs
// every name first.
export const PAGE_SIZE = 10;
export const DELETED_USER_NAME = 'Deleted user';

// One Friends document: its ID is the other person's uid, and status is its only field.
export interface FriendEntry {
  uid: string;
  status: FriendStatus;
}

export interface FriendRow {
  uid: string;
  status: FriendStatus;
  name: string;
  // What InitialsAvatar is given. Empty for a deleted user, which makes it draw its person glyph.
  avatarName: string;
  sortName: string;
  isDeleted: boolean;
}

// status is one of four strings and is compared as a string. Anything else (a boolean left over
// from the prototype, an unknown value) lands in neither section.
export const splitByStatus = (entries: FriendEntry[]): {pending: FriendEntry[]; friends: FriendEntry[]} => ({
  pending: entries.filter(entry => entry.status === 'pending'),
  friends: entries.filter(entry => entry.status === 'friend' || entry.status === 'close_friend'),
});

// A Friends document names nobody (Master Schema Q3), so a row is the document plus the person's
// Users document. No Users document means the person is gone.
export const toRow = (entry: FriendEntry, profile: CachedProfile | null): FriendRow =>
  profile
    ? {
        uid: entry.uid,
        status: entry.status,
        name: profile.name,
        avatarName: profile.name,
        sortName: profile.name_lowercase,
        isDeleted: false,
      }
    : {uid: entry.uid, status: entry.status, name: DELETED_USER_NAME, avatarName: '', sortName: '', isDeleted: true};

const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Deleted users last, then alphabetical by the stored lowercase name.
const byName = (a: FriendRow, b: FriendRow): number =>
  Number(a.isDeleted) - Number(b.isDeleted) || compare(a.sortName, b.sortName);

const closeFirst = (row: FriendRow): number => (!row.isDeleted && row.status === 'close_friend' ? 0 : 1);

// Close friends first, then everyone else; alphabetical within each group. This is your own copy
// of the status: close_friend is one-sided and nothing here checks the other person's document.
export const sortFriends = (rows: FriendRow[]): FriendRow[] =>
  [...rows].sort((a, b) => closeFirst(a) - closeFirst(b) || byName(a, b));

// Alphabetical: a Friends document has no timestamp, so newest-first isn't possible.
export const sortPending = (rows: FriendRow[]): FriendRow[] => [...rows].sort(byName);

export const isStarFilled = (status: FriendStatus): boolean => status === 'close_friend';

export const badgeCount = (pendingRows: FriendRow[]): string => String(pendingRows.length);

// The first `pages` pages of an already sorted list, and whether there is more to show.
export const pageOf = <T>(rows: T[], pages: number): {visible: T[]; hasMore: boolean} => {
  const visible = rows.slice(0, pages * PAGE_SIZE);
  return {visible, hasMore: visible.length < rows.length};
};

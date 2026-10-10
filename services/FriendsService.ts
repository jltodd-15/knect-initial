import {getAuth} from '@react-native-firebase/auth';
import {collection, getCountFromServer, getDocs, query, where} from '@react-native-firebase/firestore';
import {db} from './firestore';
import {FriendDocument} from '../types';
import {FriendCounts, FriendEntry, FriendRow, sortFriends, sortPending, splitByStatus, toRow} from './friendsList';
import {userProfileCache} from './userProfileCache';

const USERS = 'Users';
const FRIENDS = 'Friends';

// Ticket 4.4: the two reads behind the friends list and the Pending Requests section. Reads
// only, and one-time reads rather than listeners. Every rule about which document goes where and
// in what order is in services/friendsList.ts; this only asks Firestore.

type Constraint = Parameters<typeof query>[1];

// The signed-in user's own Friends subcollection, narrowed by status.
const myFriends = (...constraints: Constraint[]) => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return query(collection(db, USERS, uid, FRIENDS), ...constraints);
};

const readEntries = async (...constraints: Constraint[]): Promise<FriendEntry[]> => {
  const snapshot = await getDocs(myFriends(...constraints));
  return snapshot.docs.map(document => ({
    uid: document.id,
    status: (document.data() as FriendDocument).status,
  }));
};

// One Users read per person the session hasn't seen yet. All of them have to land before the list
// can be sorted by name, so one failing fails the section.
const toRows = (entries: FriendEntry[]): Promise<FriendRow[]> =>
  Promise.all(entries.map(async entry => toRow(entry, await userProfileCache.get(entry.uid))));

export const FriendsService = {
  // My friends and close friends, as rows in the order the list shows them.
  getFriends: async (): Promise<FriendRow[]> => {
    const entries = await readEntries(where('status', 'in', ['friend', 'close_friend']));
    return sortFriends(await toRows(splitByStatus(entries).friends));
  },

  // Requests other people have sent me, as rows in the order the list shows them.
  getPendingRequests: async (): Promise<FriendRow[]> => {
    const entries = await readEntries(where('status', '==', 'pending'));
    return sortPending(await toRows(splitByStatus(entries).pending));
  },

  // Ticket 4.6: how many friends and close friends I have. Count queries return numbers, not
  // documents, so nobody's Friends or Users document is read. They need a connection.
  getFriendCounts: async (): Promise<FriendCounts> => {
    const count = async (...constraints: Constraint[]) =>
      (await getCountFromServer(myFriends(...constraints))).data().count;
    const [friends, closeFriends] = await Promise.all([
      count(where('status', 'in', ['friend', 'close_friend'])),
      count(where('status', '==', 'close_friend')),
    ]);
    return {friends, closeFriends};
  },
};

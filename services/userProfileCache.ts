import {getAuth} from '@react-native-firebase/auth';
import {doc, getDoc} from '@react-native-firebase/firestore';
import {db} from './firestore';
import {UserDocument} from '../types';

// Ticket 4.4: the session name cache. Nothing stores a person's name next to their uid (Master
// Schema Q3), so every row showing a person reads Users/{uid}; this makes that one read per person
// per session. In memory only. Shared on purpose: a screen that needs a name for a uid uses this
// instead of building a second cache.

export interface CachedProfile {
  name: string;
  name_lowercase: string;
}

const USERS = 'Users';

// The cache belongs to whoever was signed in when it was filled. null is "nobody".
let ownerUid: string | null = null;
// Promises, not values, so two rows asking for the same person at the same moment share one read.
// null is a remembered answer too: the person has no Users document.
let entries = new Map<string, Promise<CachedProfile | null>>();

const read = async (uid: string): Promise<CachedProfile | null> => {
  const snapshot = await getDoc(doc(db, USERS, uid));
  if (!snapshot.exists()) return null;
  const {name, name_lowercase} = snapshot.data() as UserDocument;
  return {name, name_lowercase};
};

export const userProfileCache = {
  get: (uid: string): Promise<CachedProfile | null> => {
    // A different signed-in uid (sign out, sign in as someone else) starts from empty.
    const currentUid = getAuth().currentUser?.uid ?? null;
    if (currentUid !== ownerUid) {
      ownerUid = currentUid;
      entries = new Map();
    }

    const cached = entries.get(uid);
    if (cached) return cached;

    const owner = entries;
    const pending = read(uid);
    owner.set(uid, pending);
    // A failed read is not an answer: forget it, so the next load tries again.
    pending.catch(() => {
      if (owner.get(uid) === pending) owner.delete(uid);
    });
    return pending;
  },

  // Pull to refresh: every name is read again, which is how a changed name shows up.
  clear: (): void => {
    entries = new Map();
  },
};

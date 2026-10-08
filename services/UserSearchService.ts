import {getAuth} from '@react-native-firebase/auth';
import {collection, getDocs, limit, query, where} from '@react-native-firebase/firestore';
import {db} from './firestore';
import {UserDocument} from '../types';
import {RESULT_LIMIT, UserSearchResult, buildNameBounds, excludeSelf} from './userSearch';

const USERS = 'Users';

// Ticket 4.3: the one read behind the Search tab. Every rule about when and what to search is in
// services/userSearch.ts; this only asks Firestore.
export const UserSearchService = {
  // Everyone whose name starts with `text`, in any capitalization, minus the signed-in user.
  // A range on the stored name_lowercase field: Firestore has no case-insensitive query.
  searchUsers: async (text: string): Promise<UserSearchResult[]> => {
    const {start, end} = buildNameBounds(text);
    const snapshot = await getDocs(
      query(
        collection(db, USERS),
        where('name_lowercase', '>=', start),
        where('name_lowercase', '<', end),
        limit(RESULT_LIMIT),
      ),
    );
    const results = snapshot.docs.map(document => ({
      uid: document.id,
      name: (document.data() as UserDocument).name,
    }));
    return excludeSelf(results, getAuth().currentUser?.uid ?? '');
  },
};

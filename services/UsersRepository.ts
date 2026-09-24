import {doc, writeBatch} from '@react-native-firebase/firestore';
import {db} from './firestore';
import {PrivateInfoDocument, UserDocument} from '../types';

// What the signup flow hands over. Deliberately no password (credentials and profile fields never
// travel through the same call) and no avatar (profile_picture_url is written empty at creation).
export interface NewUserProfile {
  name: string;
  role: string;
  interests: string[];
  email: string;
}

const USERS = 'Users';
const PRIVATE_INFO = 'Private_info';
// Fixed ID, never generated: six tickets touch this subcollection and each would invent its own.
const PRIVATE_INFO_ID = 'main';

export const UsersRepository = {
  // Creates Users/{uid} and Users/{uid}/Private_info/main in one batch: both land or neither does.
  // Fields are read one by one rather than spread, so a caller that passes the whole signup payload
  // can't leak anything (a password, the avatar) into a document.
  createUserDocuments: async (uid: string, profile: NewUserProfile): Promise<void> => {
    const userDoc: UserDocument = {
      name: profile.name,
      // Stored, not derived at query time: Firestore has no case-insensitive query.
      name_lowercase: profile.name.toLowerCase(),
      // The signup screen's "role" input is the bio line the profile header shows.
      profile_info: profile.role,
      profile_picture_url: '',
      // Written as handed over: normalizing the vocabulary isn't this module's job.
      interests: profile.interests,
    };
    // Email lives here and nowhere else: every signed-in user can read Users/{uid}.
    const privateInfoDoc: PrivateInfoDocument = {
      email: profile.email,
      blocked_users: [],
      fcm_tokens: [],
    };

    const batch = writeBatch(db);
    batch.set(doc(db, USERS, uid), userDoc);
    batch.set(doc(db, USERS, uid, PRIVATE_INFO, PRIVATE_INFO_ID), privateInfoDoc);
    await batch.commit();
  },
};

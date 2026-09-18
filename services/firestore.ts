import {getApp} from '@react-native-firebase/app';
import {initializeFirestore} from '@react-native-firebase/firestore';

// The one place Firestore is configured. Every other file imports `db` from here and
// never calls the SDK's initializer itself: settings can't change once the instance
// has been used, so a second configuration site would either throw or be ignored.
//
// Persistence is set on explicitly. The native SDKs likely default to on already; writing
// it down makes it a decision with one file to read, not behavior inherited from the SDK.
// There is deliberately no cacheSizeBytes: the SDK's default is the decision, and an
// explicit number would be a magic value someone has to justify later.
export const db = initializeFirestore(getApp(), {persistence: true});

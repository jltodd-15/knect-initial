import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
} from '@react-native-firebase/auth';

export const AuthService = {
  subscribeToAuthState: (
    callback: (user: User | null) => void,
  ): (() => void) => {
    return onAuthStateChanged(getAuth(), callback);
  },

  signIn: async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(getAuth(), email, password);
  },

  signUp: async (email: string, password: string): Promise<string> => {
    const credential = await createUserWithEmailAndPassword(getAuth(), email, password);
    return credential.user.uid;
  },

  signOutUser: async (): Promise<void> => {
    await signOut(getAuth());
  },

  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(getAuth(), email);
  },
};

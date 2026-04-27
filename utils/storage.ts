import { createAsyncStorage } from "@react-native-async-storage/async-storage";
import * as Keychain from 'react-native-keychain';

export const localStorage =
{
  userData: (name: string) => createAsyncStorage(name),
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error(e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(e);
    }
  }
};

// Keychain exports
const options: Keychain.SetOptions = {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH
}

export const keyChain = 
{
  userLogin: (username: string, password: string) => {
    try {
      Keychain.setGenericPassword(username, password, options);
    } catch (e) {
      console.error(e);
    }
  }
};
import { createAsyncStorage,  } from "@react-native-async-storage/async-storage";
import * as Keychain from 'react-native-keychain';

export const userStore = createAsyncStorage("user_data");

// Keychain exports
const options: Keychain.SetOptions = {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH
}

export const keyChain =
{
  userLogin: async (username: string, password: string) => {
    try {
      await Keychain.setGenericPassword(username, password, options);
    } catch (e) {
      console.error(e);
    }
  }
};
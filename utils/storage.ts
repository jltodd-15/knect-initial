import { createAsyncStorage } from "@react-native-async-storage/async-storage";

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
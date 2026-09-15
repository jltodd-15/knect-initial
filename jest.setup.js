/* eslint-env jest */
// Jest runs outside React Native, so there's no native AsyncStorage module for
// @react-native-async-storage/async-storage to bind to. Mock it with a simple
// in-memory store backing the two methods this repo actually uses (getItem/setItem).
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    createAsyncStorage: () => ({
      getItem: async key => (store.has(key) ? store.get(key) : null),
      setItem: async (key, value) => {
        store.set(key, value);
      },
    }),
  };
});

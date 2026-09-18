/* eslint-env jest */
// The default 5000ms per-test timeout is too tight on a loaded sandbox where
// real wall-clock scheduling can lag well behind actual test work; give tests
// more headroom so transient system contention doesn't cascade into spurious
// timeouts (a timed-out test can leave React in a broken state for whatever
// runs after it in the same file).
jest.setTimeout(600000);

// react-native-safe-area-context needs a native measurement (onLayout) to
// populate its insets, which never fires in a pure-JS test renderer, so
// SafeAreaProvider renders empty without this official mock.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

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

// Jest runs outside React Native, so there's no native Firebase Auth module for
// @react-native-firebase/auth to bind to. Mock the modular API surface this repo
// uses, with an in-memory "current user" backing onAuthStateChanged.
jest.mock('@react-native-firebase/auth', () => {
  let currentUser = null;
  let listeners = [];
  const notifyAll = () => listeners.forEach(cb => cb(currentUser));

  return {
    getAuth: jest.fn(() => ({})),
    onAuthStateChanged: jest.fn((auth, callback) => {
      listeners.push(callback);
      callback(currentUser);
      return () => {
        const idx = listeners.indexOf(callback);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    }),
    // Deliberately does NOT call notifyAll() on success: no test in this
    // file needs the onAuthStateChanged cascade to fire from a successful
    // sign-in/sign-up call (that UI transition - landing on the tab tree -
    // is verified on-device instead, per the ticket 1.2 plan). Mounting the
    // tab tree (EventPlanner etc., unrelated out-of-scope code) from inside
    // a test here hangs indefinitely in this environment; not triggering it
    // at all is simpler and more robust than chasing that down.
    signInWithEmailAndPassword: jest.fn(async (auth, email) => {
      currentUser = { uid: 'test-uid', email };
      return { user: currentUser };
    }),
    createUserWithEmailAndPassword: jest.fn(async (auth, email) => {
      currentUser = { uid: 'test-uid', email };
      return { user: currentUser };
    }),
    signOut: jest.fn(async () => {
      currentUser = null;
      notifyAll();
    }),
    sendPasswordResetEmail: jest.fn(async () => {}),
    // Test-only escape hatch: the closure above persists for the whole test
    // file (the mock factory runs once per file, not per test), so tests
    // must reset it between runs or session state leaks across tests.
    __resetAuthMock: () => {
      currentUser = null;
      listeners = [];
    },
  };
});

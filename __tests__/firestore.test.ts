/**
 * Ticket 2.1: the one place Firestore is configured.
 *
 * Firestore's native module doesn't exist under Jest, so the SDK is mocked here
 * (in this file, not jest.setup.js: nothing else in the suite touches Firestore).
 * These tests pin the *decision* the ticket makes: persistence is set explicitly
 * on, no cache size is written down, and the module runs before the app does.
 * Whether the cache actually serves reads offline is only provable on a device.
 */

const mockApp = {name: '[DEFAULT]'};
const mockDb = {__brand: 'firestore-instance'};
const mockInitializeFirestore = jest.fn();

// The arrow wrappers defer the lookup until the module is first required, so
// the mock* consts above are initialised by then (jest.mock is hoisted).
jest.mock('@react-native-firebase/app', () => ({
  getApp: () => mockApp,
}));
jest.mock('@react-native-firebase/firestore', () => ({
  initializeFirestore: (...args: unknown[]) => mockInitializeFirestore(...args),
}));

// Fresh module registry per load, so each test sees the module's top-level code run.
const loadConfigModule = (): {db: unknown} => {
  let mod: {db: unknown} | undefined;
  jest.isolateModules(() => {
    mod = require('../services/firestore');
  });
  return mod as {db: unknown};
};

beforeEach(() => {
  jest.clearAllMocks();
  mockInitializeFirestore.mockReturnValue(mockDb);
});

test('configures Firestore exactly once, on the default app', () => {
  loadConfigModule();

  expect(mockInitializeFirestore).toHaveBeenCalledTimes(1);
  expect(mockInitializeFirestore.mock.calls[0][0]).toBe(mockApp);
});

test('sets persistence explicitly on, and sets nothing else', () => {
  loadConfigModule();

  const settings = mockInitializeFirestore.mock.calls[0][1];
  expect(settings).toEqual({persistence: true});
  // toEqual ignores keys whose value is undefined, so also check the key list:
  // no cacheSizeBytes (the SDK default is the decision), no host/ssl (no emulator wiring).
  expect(Object.keys(settings)).toEqual(['persistence']);
});

test('exports the configured instance as db, for every later ticket to import', () => {
  const {db} = loadConfigModule();

  expect(db).toBe(mockDb);
});

test('index.js loads the config module before it registers the app', () => {
  const order: string[] = [];

  jest.isolateModules(() => {
    jest.doMock('../services/firestore', () => {
      order.push('firestore config');
      return {db: mockDb};
    });
    jest.doMock('../App', () => ({__esModule: true, default: () => null}));
    jest.doMock('../components/ErrorBoundary', () => ({
      __esModule: true,
      default: () => null,
    }));
    jest.doMock('react-native', () => ({
      AppRegistry: {
        registerComponent: jest.fn(() => {
          order.push('registerComponent');
        }),
      },
    }));

    require('../index');
  });

  expect(order).toEqual(['firestore config', 'registerComponent']);
});

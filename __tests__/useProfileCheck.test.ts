/**
 * Ticket 2.3: the write-timeout helper and the one-time profile-exists read.
 *
 * Firestore's native module doesn't exist under Jest, so getDoc/doc are mocked the same way
 * UsersRepository.test.ts mocks writeBatch/doc — a fake `db` swapped in for services/firestore.
 */

const mockDb = {__brand: 'firestore-instance'};
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

jest.mock('@react-native-firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));
jest.mock('../services/firestore', () => ({
  get db() {
    return mockDb;
  },
}));

import {withTimeout, TimeoutError, checkUserProfileExists, WRITE_TIMEOUT_MS} from '../hooks/useProfileCheck';

beforeEach(() => {
  jest.clearAllMocks();
  mockDoc.mockImplementation((_db: unknown, ...segments: string[]) => ({path: segments.join('/')}));
});

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('resolves with the underlying value when it settles before the timeout', async () => {
    const result = withTimeout(Promise.resolve('ok'), 15000);
    await expect(result).resolves.toBe('ok');
  });

  test('rejects with the underlying error when the promise rejects before the timeout', async () => {
    const result = withTimeout(Promise.reject(new Error('write failed')), 15000);
    await expect(result).rejects.toThrow('write failed');
  });

  test('rejects with TimeoutError once the bound elapses and the promise never settles', async () => {
    const neverSettles = new Promise(() => {});
    const result = withTimeout(neverSettles, 15000);
    jest.advanceTimersByTime(15000);
    await expect(result).rejects.toBeInstanceOf(TimeoutError);
  });

  test('does not fire the timeout after the promise already resolved', async () => {
    const result = withTimeout(Promise.resolve('done'), 15000);
    await expect(result).resolves.toBe('done');
    // Should not throw / leave a dangling rejection when the timer would have fired.
    jest.advanceTimersByTime(15000);
  });
});

describe('checkUserProfileExists', () => {
  test('resolves true when the document exists', async () => {
    mockGetDoc.mockResolvedValue({exists: () => true});

    await expect(checkUserProfileExists('uid-123')).resolves.toBe(true);
  });

  test('resolves false when the document does not exist', async () => {
    mockGetDoc.mockResolvedValue({exists: () => false});

    await expect(checkUserProfileExists('uid-123')).resolves.toBe(false);
  });

  test('rejects, rather than resolving false, when the read itself fails', async () => {
    mockGetDoc.mockRejectedValue(new Error('offline, no cache'));

    await expect(checkUserProfileExists('uid-123')).rejects.toThrow('offline, no cache');
  });

  test('reads Users/{uid} via the shared db instance', async () => {
    mockGetDoc.mockResolvedValue({exists: () => true});

    await checkUserProfileExists('uid-123');

    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'Users', 'uid-123');
  });
});

test('the write timeout is 15 seconds', () => {
  expect(WRITE_TIMEOUT_MS).toBe(15000);
});

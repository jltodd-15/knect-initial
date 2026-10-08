/**
 * Ticket 2.2: handleProfileComplete calls the Users repository once the auth call has resolved.
 * Ticket 2.3: that call is awaited and reflected — submitting state, a double-submit guard, a
 * two-attempt retry-then-sign-out path, and the tab tree is only reachable after a confirmed
 * write.
 *
 * CreateProfilePage is stubbed: its own steps are pinned in CreateProfilePage.test.tsx, and this
 * test only cares about what App does with the profile and credentials it is handed (ticket 1.4:
 * two separate arguments, so the password never rides along with the profile). The repository is mocked (its own
 * behavior is pinned in UsersRepository.test.ts), which also keeps the native Firestore module
 * out of the App import graph. hooks/useProfileCheck is mocked for the same reason (it imports
 * services/firestore, which calls the native Firestore initializer at module load) — none of
 * these tests exercise the missing-profile read itself (see App.profileCheck.test.tsx), since the
 * shared auth mock doesn't cascade onAuthStateChanged on a successful sign-up (see jest.setup.js).
 */

import React from 'react';
import {render, fireEvent, screen, waitFor} from '@testing-library/react-native';
import {act} from 'react-test-renderer';
import App from '../App';
import {UsersRepository} from '../services/UsersRepository';

const authMock = require('@react-native-firebase/auth');

jest.mock('../services/UsersRepository', () => ({
  UsersRepository: {createUserDocuments: jest.fn(async () => {})},
}));

// Ticket 4.3: the Search tab imports the user search, which imports the native Firestore module
// too. No test here searches (see SearchTab.test.tsx), so cut that import chain off as well.
jest.mock('../services/UserSearchService', () => ({
  UserSearchService: {searchUsers: jest.fn(async () => [])},
}));

jest.mock('../hooks/useProfileCheck', () => ({
  checkUserProfileExists: jest.fn(async () => true),
  withTimeout: jest.fn((promise: Promise<unknown>) => promise),
  WRITE_TIMEOUT_MS: 15000,
}));

// The stub submits the same shape CreateProfilePage's onComplete sends, and surfaces the
// `submitting` prop as text so tests can observe the state App drives it with. It also stashes
// the current `onComplete` in a module-level box so a test can call it directly, bypassing
// fireEvent/act() entirely for the one test that fires several rapid, overlapping taps (React's
// act() only supports one open scope at a time, so simulating a real rapid tap sequence needs to
// sidestep it rather than fight it).
const latestOnComplete: {current: ((profile: unknown, credentials: unknown) => void) | null} = {current: null};
jest.mock('../components/CreateProfilePage', () => {
  const mockReact = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  return {
    __esModule: true,
    default: ({
      onComplete,
      submitting,
      signupError,
    }: {
      onComplete: (profile: unknown, credentials: unknown) => void;
      submitting: string;
      signupError?: {target: string; message: string} | null;
    }) => {
      latestOnComplete.current = onComplete;
      return mockReact.createElement(
        mockReact.Fragment,
        null,
        mockReact.createElement(
          TouchableOpacity,
          {
            onPress: () =>
              onComplete(
                {
                  name: 'John Smith',
                  bio: 'Digital nomad',
                  interests: ['Board games', 'Hiking'],
                  profile_picture_url: '',
                },
                {email: 'john@example.com', password: 'Hunter2-Secret'},
              ),
          },
          mockReact.createElement(Text, null, 'SUBMIT PROFILE'),
        ),
        mockReact.createElement(Text, null, `SUBMIT STATE: ${submitting}`),
        signupError
          ? mockReact.createElement(Text, null, `SIGNUP ERROR (${signupError.target}): ${signupError.message}`)
          : null,
      );
    },
  };
});

const createUserDocuments = UsersRepository.createUserDocuments as jest.Mock;
const profileData = {
  name: 'John Smith',
  bio: 'Digital nomad',
  interests: ['Board games', 'Hiking'],
  profile_picture_url: '',
};
const credentials = {email: 'john@example.com', password: 'Hunter2-Secret'};

afterEach(() => {
  jest.clearAllMocks();
  authMock.__resetAuthMock();
});

const submitSignUp = async () => {
  await render(<App />);
  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));
  await fireEvent.press(screen.getByText('SUBMIT PROFILE'));
};

// Resolves/rejects only when the test tells it to, so a test can observe the "submitting" state
// and drive concurrent taps while the write is genuinely still in flight.
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
};

test('after the auth account is created, the Users repository is called with its uid and the profile', async () => {
  await submitSignUp();

  await waitFor(() => expect(createUserDocuments).toHaveBeenCalledTimes(1));
  expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    'john@example.com',
    'Hunter2-Secret',
  );
  // 'test-uid' is the uid the auth mock hands back: it proves signUp passes the uid through.
  expect(createUserDocuments).toHaveBeenCalledWith('test-uid', {
    name: 'John Smith',
    role: 'Digital nomad',
    interests: ['Board games', 'Hiking'],
    email: 'john@example.com',
  });
});

test('the auth call resolves before the repository is called', async () => {
  await submitSignUp();

  await waitFor(() => expect(createUserDocuments).toHaveBeenCalled());
  const authOrder = authMock.createUserWithEmailAndPassword.mock.invocationCallOrder[0];
  const repoOrder = createUserDocuments.mock.invocationCallOrder[0];
  expect(authOrder).toBeLessThan(repoOrder);
});

test('the password and picture are not handed to the repository', async () => {
  await submitSignUp();

  await waitFor(() => expect(createUserDocuments).toHaveBeenCalled());
  const [, profile] = createUserDocuments.mock.calls[0];
  expect(profile).not.toHaveProperty('password');
  expect(profile).not.toHaveProperty('profile_picture_url');
  expect(profile).not.toHaveProperty('avatar');
});

test('no repository call is made when the auth account could not be created', async () => {
  authMock.createUserWithEmailAndPassword.mockRejectedValueOnce({code: 'auth/email-already-in-use'});

  await submitSignUp();

  await waitFor(() => expect(screen.getByText(/Email already in use/)).toBeTruthy());
  expect(createUserDocuments).not.toHaveBeenCalled();
});

test('an auth rejection stays on the create-account screen, aimed at the field it is about', async () => {
  authMock.createUserWithEmailAndPassword.mockRejectedValueOnce({code: 'auth/email-already-in-use'});

  await submitSignUp();

  await waitFor(() =>
    expect(screen.getByText('SIGNUP ERROR (email): Email already in use')).toBeTruthy(),
  );
  expect(screen.getByText('SUBMIT STATE: idle')).toBeTruthy();
  expect(screen.queryByText('SIGN IN')).toBeNull();
});

test('a password-policy rejection is aimed at the password field', async () => {
  authMock.createUserWithEmailAndPassword.mockRejectedValueOnce({
    code: 'auth/password-does-not-meet-requirements',
  });

  await submitSignUp();

  await waitFor(() =>
    expect(
      screen.getByText(
        'SIGNUP ERROR (password): Password must be at least 8 characters and include a capital letter and a number',
      ),
    ).toBeTruthy(),
  );
});

test('a network rejection is a general error', async () => {
  authMock.createUserWithEmailAndPassword.mockRejectedValueOnce({code: 'auth/network-request-failed'});

  await submitSignUp();

  await waitFor(() => expect(screen.getByText(/SIGNUP ERROR \(general\)/)).toBeTruthy());
});

test('after an auth rejection, a corrected resubmit creates the account', async () => {
  authMock.createUserWithEmailAndPassword.mockRejectedValueOnce({code: 'auth/email-already-in-use'});

  await submitSignUp();
  await waitFor(() => expect(screen.getByText(/SIGNUP ERROR/)).toBeTruthy());

  await act(async () => {
    await latestOnComplete.current!(profileData, {...credentials, email: 'other@example.com'});
  });

  expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledTimes(2);
  expect(createUserDocuments).toHaveBeenCalledWith('test-uid', expect.objectContaining({email: 'other@example.com'}));
  expect(screen.queryByText(/SIGNUP ERROR/)).toBeNull();
});

// These two tests leave the write genuinely pending (never resolved until the test says so) so
// they can observe the in-flight "submitting" state. `fireEvent.press` can't be awaited right at
// that tap: it wraps the press in `act()`, which doesn't settle until the whole async handler
// chain it triggered does — awaiting it there would deadlock against the very promise this test
// resolves afterward. Firing without awaiting still runs the handler synchronously up to its
// first `await` (ordinary JS async-function semantics), which is enough to set the submitting
// state and engage the double-submit guard. The returned promise is still captured and awaited
// later, once the write resolves — leaving it fully unawaited corrupts React's act() scope
// tracking across tests ("overlapping act() calls").

test('the button shows a submitting state for the duration of the write', async () => {
  const write = deferred<void>();
  createUserDocuments.mockReturnValueOnce(write.promise);

  await render(<App />);
  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));
  const pressed = fireEvent.press(screen.getByText('SUBMIT PROFILE'));

  await waitFor(() => expect(screen.getByText('SUBMIT STATE: submitting')).toBeTruthy());

  // The continuation after the write resolves (the state updates that land the app back on
  // "idle") must itself run inside an act() scope, same as the press that started it.
  await act(async () => {
    write.resolve();
    await pressed;
  });
  await waitFor(() => expect(screen.queryByText('SUBMIT STATE: submitting')).toBeNull());
});

test('repeated taps during an in-flight write produce exactly one auth call and one write call', async () => {
  // React's act() doesn't support two overlapping scopes, so three back-to-back
  // `fireEvent.press` calls (each opening its own act() scope) can't model "rapid taps while a
  // write is in flight" here. Instead, invoke the button's onPress directly, three times in a
  // row with nothing awaited between them — exactly what a real rapid triple-tap does from the
  // guard's point of view (it's a synchronous ref check, not something `act` needs to mediate).
  const write = deferred<void>();
  createUserDocuments.mockReturnValueOnce(write.promise);

  await render(<App />);
  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));

  const onComplete = latestOnComplete.current!;
  let firstPress!: Promise<void>;
  act(() => {
    firstPress = onComplete(profileData, credentials) as unknown as Promise<void>;
    onComplete(profileData, credentials); // guarded: returns immediately
    onComplete(profileData, credentials); // guarded: returns immediately
  });

  await waitFor(() => expect(createUserDocuments).toHaveBeenCalledTimes(1));
  expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);

  await act(async () => {
    write.resolve();
    await firstPress;
  });
  await waitFor(() => expect(screen.queryByText('SUBMIT STATE: submitting')).toBeNull());
  expect(createUserDocuments).toHaveBeenCalledTimes(1);
});

test('a failed write shows the failed state, without a second auth call', async () => {
  createUserDocuments.mockRejectedValueOnce(new Error('offline'));

  await submitSignUp();

  await waitFor(() => expect(screen.getByText('SUBMIT STATE: failed')).toBeTruthy());
  expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
  expect(createUserDocuments).toHaveBeenCalledTimes(1);
});

test('retrying after one failure reuses the existing account and does not sign out', async () => {
  createUserDocuments.mockRejectedValueOnce(new Error('offline'));

  await submitSignUp();
  await waitFor(() => expect(screen.getByText('SUBMIT STATE: failed')).toBeTruthy());

  createUserDocuments.mockResolvedValueOnce(undefined);
  await fireEvent.press(screen.getByText('SUBMIT PROFILE'));

  await waitFor(() => expect(createUserDocuments).toHaveBeenCalledTimes(2));
  expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
  expect(authMock.signOut).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByText('SUBMIT STATE: submitting')).toBeNull());
});

test('"Try Again" saves the email the account was created with, even if the field was edited', async () => {
  createUserDocuments.mockRejectedValueOnce(new Error('offline'));

  await submitSignUp();
  await waitFor(() => expect(screen.getByText('SUBMIT STATE: failed')).toBeTruthy());

  // The email field is still editable after a failure; the user changes it, then retries.
  await act(async () => {
    await latestOnComplete.current!(profileData, {...credentials, email: 'edited@example.com'});
  });

  expect(createUserDocuments).toHaveBeenCalledTimes(2);
  expect(createUserDocuments.mock.calls[1][1].email).toBe('john@example.com');
});

test('two failed write attempts sign the user out and show the sign-out copy, leaving the Auth account intact', async () => {
  createUserDocuments.mockRejectedValueOnce(new Error('offline'));
  createUserDocuments.mockRejectedValueOnce(new Error('offline again'));

  await submitSignUp();
  await waitFor(() => expect(screen.getByText('SUBMIT STATE: failed')).toBeTruthy());

  await fireEvent.press(screen.getByText('SUBMIT PROFILE'));

  await waitFor(() => expect(authMock.signOut).toHaveBeenCalledTimes(1));
  expect(createUserDocuments).toHaveBeenCalledTimes(2);
  expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(screen.getByText(/That email is already registered/)).toBeTruthy(),
  );
});

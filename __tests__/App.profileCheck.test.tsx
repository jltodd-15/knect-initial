/**
 * Ticket 2.3: the missing-profile detector. Once onAuthStateChanged reports a signed-in user,
 * App reads Users/{uid} once (a get(), never a listener) and renders the tab tree only when the
 * document exists — otherwise it falls back to CreateProfilePage, the same interim branch a
 * brand-new signup uses (1.4 owns what actually happens there for a returning user; this ticket
 * only owns catching the state).
 *
 * The shared @react-native-firebase/auth mock in jest.setup.js deliberately does not cascade
 * onAuthStateChanged on a successful sign-in (see its own comment there) — fine for the other two
 * App test files, which don't need isAuth to actually flip. This file's entire point is what
 * renders once it does, so it defines its own local override of that one mock, scoped to this
 * file only.
 */

import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react-native';
import {act} from 'react-test-renderer';

jest.mock('@react-native-firebase/auth', () => {
  let currentUser: {uid: string; email: string} | null = null;
  let listeners: Array<(user: typeof currentUser) => void> = [];
  const notifyAll = () => listeners.forEach(cb => cb(currentUser));

  return {
    getAuth: jest.fn(() => ({})),
    onAuthStateChanged: jest.fn((auth: unknown, callback: (user: typeof currentUser) => void) => {
      listeners.push(callback);
      callback(currentUser);
      return () => {
        const idx = listeners.indexOf(callback);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    }),
    // Unlike the shared jest.setup.js mock, both of these DO cascade the listeners, as real
    // Firebase does — that cascade is exactly what this file exercises. For sign-up it's what
    // creates the race below: Firebase reports "signed in" before the profile write has landed.
    signInWithEmailAndPassword: jest.fn(async (auth: unknown, email: string) => {
      currentUser = {uid: 'test-uid', email};
      notifyAll();
      return {user: currentUser};
    }),
    createUserWithEmailAndPassword: jest.fn(async (auth: unknown, email: string) => {
      currentUser = {uid: 'test-uid', email};
      notifyAll();
      return {user: currentUser};
    }),
    signOut: jest.fn(async () => {
      currentUser = null;
      notifyAll();
    }),
    sendPasswordResetEmail: jest.fn(async () => {}),
    __resetAuthMock: () => {
      currentUser = null;
      listeners = [];
    },
    // Test-only: start the app with a session already saved on the device (a cold start).
    __setSignedInUser: (user: {uid: string; email: string} | null) => {
      currentUser = user;
    },
  };
});

import App from '../App';
import {checkUserProfileExists} from '../hooks/useProfileCheck';
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

// Ticket 4.4: the Search tab's Friends and Pending Requests sections import the native Firestore
// module the same way. No test here reads friends (see SearchTab.test.tsx), so cut that off too.
jest.mock('../services/FriendsService', () => ({
  FriendsService: {getFriends: jest.fn(async () => []), getPendingRequests: jest.fn(async () => [])},
}));
jest.mock('../services/userProfileCache', () => ({
  userProfileCache: {get: jest.fn(async () => null), clear: jest.fn()},
}));

jest.mock('../hooks/useProfileCheck', () => ({
  checkUserProfileExists: jest.fn(),
  withTimeout: jest.fn((promise: Promise<unknown>) => promise),
  WRITE_TIMEOUT_MS: 15000,
}));

// The tab tree itself is unrelated, pre-existing, out-of-scope UI for this ticket — and per
// App.signup.test.tsx / jest.setup.js's own precedent, actually mounting it (EventPlanner, etc.)
// hangs indefinitely in this environment. This test's job is only to confirm which screen
// renders, not to exercise what's inside it, so every tab screen is stubbed to a plain marker.
// "TAB TREE" is the Planner tab, the one a new user must land on. Navigation and ProfilePage get
// one button each, so a test can switch to the Profile tab and log out from it.
const stubComponent = (label: string) => () => {
  const mockReact = require('react');
  const {Text} = require('react-native');
  return mockReact.createElement(Text, null, label);
};
jest.mock('../components/Navigation', () => ({
  __esModule: true,
  default: ({navigation}: {navigation: {navigate: (tab: string) => void}}) => {
    const mockReact = require('react');
    const {TouchableOpacity, Text} = require('react-native');
    return mockReact.createElement(
      TouchableOpacity,
      {onPress: () => navigation.navigate('Profile')},
      mockReact.createElement(Text, null, 'GO TO PROFILE TAB'),
    );
  },
}));
jest.mock('../components/EventPlanner', () => ({__esModule: true, default: stubComponent('TAB TREE')}));
jest.mock('../components/DiscoveryFeed', () => ({__esModule: true, default: stubComponent('FEED')}));
jest.mock('../components/SocialDashboard', () => ({__esModule: true, default: stubComponent('SOCIAL')}));
jest.mock('../components/ProfilePage', () => ({
  __esModule: true,
  default: ({onLogout}: {onLogout: () => void}) => {
    const mockReact = require('react');
    const {TouchableOpacity, Text} = require('react-native');
    return mockReact.createElement(
      TouchableOpacity,
      {onPress: onLogout},
      mockReact.createElement(Text, null, 'PROFILE TAB: LOG OUT'),
    );
  },
}));

const createUserDocuments = UsersRepository.createUserDocuments as jest.Mock;

const checkUserProfileExistsMock = checkUserProfileExists as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
  authMock.__resetAuthMock();
});

const signIn = async () => {
  await render(<App />);
  await signInOnLoginScreen();
};

const signInOnLoginScreen = async () => {
  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'password123');
  await fireEvent.press(screen.getByText('SIGN IN'));
};

// Fills the real CreateProfilePage (its two steps) and leaves it one tap from submitting.
const fillCreateProfileForm = async (email = 'new@b.com') => {
  await fireEvent.changeText(screen.getByPlaceholderText('username@example.com'), email);
  await fireEvent.changeText(screen.getByPlaceholderText('Create a password'), 'Passw0rd');
  await fireEvent.press(screen.getByLabelText('Next'));
  await fillProfileStep();
};

// Step two alone: all a resumed signup (signed in, no profile) is asked for.
const fillProfileStep = async () => {
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Alex Rivera'), 'Alex Rivera');
  await fireEvent.changeText(screen.getByPlaceholderText('A line about you (optional)'), 'Digital Nomad');
};

test('once signed in, the profile-exists check runs once with the reported uid', async () => {
  checkUserProfileExistsMock.mockResolvedValue(true);

  await signIn();

  await waitFor(() => expect(checkUserProfileExistsMock).toHaveBeenCalledWith('test-uid'));
  expect(checkUserProfileExistsMock).toHaveBeenCalledTimes(1);
});

test('a present profile does not show the login screen or the missing-profile branch', async () => {
  checkUserProfileExistsMock.mockResolvedValue(true);

  await signIn();

  await waitFor(() => expect(screen.getByText('TAB TREE')).toBeTruthy());
  expect(screen.queryByPlaceholderText('EMAIL ADDRESS')).toBeNull();
  expect(screen.queryByPlaceholderText('username@example.com')).toBeNull();
});

test('a missing profile resumes the signup at step two, not step one or the tab tree', async () => {
  checkUserProfileExistsMock.mockResolvedValue(false);

  await signIn();

  await waitFor(() => expect(screen.getByPlaceholderText('e.g. Alex Rivera')).toBeTruthy());
  expect(screen.queryByPlaceholderText('username@example.com')).toBeNull();
  expect(screen.queryByText('TAB TREE')).toBeNull();
});

// The race: during a successful sign-up, Firebase reports "signed in" the moment the account is
// created, so the profile-exists check starts before the profile write has landed and can come
// back "no profile". If that stale answer arrives after the write succeeded, it must be ignored —
// otherwise a brand-new user is bounced back onto CreateProfilePage.
test('a stale "no profile" answer from before the signup write landed does not bounce the new user', async () => {
  let resolveStaleCheck!: (exists: boolean) => void;
  checkUserProfileExistsMock.mockReturnValueOnce(
    new Promise<boolean>(resolve => {
      resolveStaleCheck = resolve;
    }),
  );

  await render(<App />);
  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));
  await fillCreateProfileForm();
  await fireEvent.press(screen.getByText('COMPLETE PROFILE'));

  // The check started mid-signup and is still pending; the write has succeeded.
  expect(checkUserProfileExistsMock).toHaveBeenCalledWith('test-uid');
  await waitFor(() => expect(screen.getByText('TAB TREE')).toBeTruthy());

  // Now the stale answer arrives.
  await act(async () => {
    resolveStaleCheck(false);
  });

  expect(screen.getByText('TAB TREE')).toBeTruthy();
  expect(screen.queryByPlaceholderText('username@example.com')).toBeNull();
});

test('a failed read leaves the app on neither the login screen, CreateProfilePage, nor signed out', async () => {
  checkUserProfileExistsMock.mockRejectedValue(new Error('offline, no cache'));

  await signIn();

  await waitFor(() => expect(checkUserProfileExistsMock).toHaveBeenCalled());
  expect(screen.queryByPlaceholderText('EMAIL ADDRESS')).toBeNull();
  expect(screen.queryByPlaceholderText('username@example.com')).toBeNull();
  expect(screen.queryByText('TAB TREE')).toBeNull();
  expect(authMock.signOut).not.toHaveBeenCalled();
});

test('a signed-in user with no profile saves one to their existing account, without creating another', async () => {
  checkUserProfileExistsMock.mockResolvedValue(false);

  await signIn(); // signed in as a@b.com, uid test-uid, no Users document
  await waitFor(() => expect(screen.getByPlaceholderText('e.g. Alex Rivera')).toBeTruthy());

  // No email step: the account they're already signed into is the one that gets the profile.
  await fillProfileStep();
  await fireEvent.press(screen.getByText('COMPLETE PROFILE'));

  expect(authMock.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  expect(createUserDocuments).toHaveBeenCalledWith('test-uid', {
    name: 'Alex Rivera',
    role: 'Digital Nomad',
    interests: [],
    email: 'a@b.com',
  });
  await waitFor(() => expect(screen.getByText('TAB TREE')).toBeTruthy());
});

test('a new signup lands on the Planner tab even after the last user logged out from the Profile tab', async () => {
  checkUserProfileExistsMock.mockResolvedValue(true);

  await signIn();
  await waitFor(() => expect(screen.getByText('TAB TREE')).toBeTruthy());
  await fireEvent.press(screen.getByText('GO TO PROFILE TAB'));
  await fireEvent.press(screen.getByText('PROFILE TAB: LOG OUT'));
  await waitFor(() => expect(screen.getByText('CREATE ACCOUNT')).toBeTruthy());

  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));
  await fillCreateProfileForm();
  await fireEvent.press(screen.getByText('COMPLETE PROFILE'));

  await waitFor(() => expect(screen.getByText('TAB TREE')).toBeTruthy());
  expect(screen.queryByText('PROFILE TAB: LOG OUT')).toBeNull();
});

test('on a cold start with a saved session, only the loading spinner shows until the profile check answers', async () => {
  let answerCheck!: (exists: boolean) => void;
  checkUserProfileExistsMock.mockReturnValueOnce(
    new Promise<boolean>(resolve => {
      answerCheck = resolve;
    }),
  );
  authMock.__setSignedInUser({uid: 'test-uid', email: 'a@b.com'});

  await render(<App />);

  // Check still pending: neither the login screen, the signup screen, nor the app.
  expect(checkUserProfileExistsMock).toHaveBeenCalledWith('test-uid');
  expect(screen.queryByPlaceholderText('EMAIL ADDRESS')).toBeNull();
  expect(screen.queryByPlaceholderText('username@example.com')).toBeNull();
  expect(screen.queryByText('TAB TREE')).toBeNull();

  await act(async () => {
    answerCheck(true);
  });

  expect(screen.getByText('TAB TREE')).toBeTruthy();
});

test('full loop: two failed saves sign the user out; signing back in lands on the create-profile screen', async () => {
  checkUserProfileExistsMock.mockResolvedValue(false);
  createUserDocuments.mockRejectedValueOnce(new Error('offline'));
  createUserDocuments.mockRejectedValueOnce(new Error('offline again'));

  await render(<App />);
  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));
  await fillCreateProfileForm();
  await fireEvent.press(screen.getByText('COMPLETE PROFILE'));
  await waitFor(() => expect(screen.getByText('TRY AGAIN')).toBeTruthy());

  await fireEvent.press(screen.getByText('TRY AGAIN'));

  // Signed out, back on the login screen, told why.
  await waitFor(() => expect(screen.getByText(/That email is already registered/)).toBeTruthy());
  expect(authMock.signOut).toHaveBeenCalledTimes(1);

  // Sign back in: the account exists but has no profile, so the signup resumes at step two.
  await signInOnLoginScreen();
  await waitFor(() => expect(screen.getByPlaceholderText('e.g. Alex Rivera')).toBeTruthy());
  expect(screen.queryByPlaceholderText('username@example.com')).toBeNull();
  expect(screen.queryByText('TAB TREE')).toBeNull();

  // ...and finishing it saves to that same account and lands in the app.
  await fillProfileStep();
  await fireEvent.press(screen.getByText('COMPLETE PROFILE'));
  await waitFor(() => expect(screen.getByText('TAB TREE')).toBeTruthy());
  expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
  expect(createUserDocuments).toHaveBeenLastCalledWith('test-uid', expect.objectContaining({email: 'a@b.com'}));
});

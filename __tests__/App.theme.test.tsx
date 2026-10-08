/**
 * Ticket 4.2: App.tsx on the theme. The app opens in the phone's light or dark setting, the two
 * launch waits show the "Kn" logo instead of a spinner. (The Profile tab's dark-mode switch is in
 * ProfilePage.theme.test.tsx.)
 *
 * Same stand-ins as App.profileCheck.test.tsx: an auth mock that can start signed in, and stubbed
 * tab screens. The tab bar and the Search placeholder are the real components.
 */

import React from 'react';
import {StyleSheet} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {act} from 'react-test-renderer';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}));

jest.mock('@react-native-firebase/auth', () => {
  let currentUser: {uid: string; email: string} | null = null;
  let holdBack = false;
  return {
    getAuth: jest.fn(() => ({})),
    onAuthStateChanged: jest.fn((auth: unknown, callback: (user: typeof currentUser) => void) => {
      if (!holdBack) callback(currentUser);
      return () => {};
    }),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(async () => {}),
    sendPasswordResetEmail: jest.fn(async () => {}),
    __reset: () => {
      currentUser = null;
      holdBack = false;
    },
    // Start the app with a session already saved on the device.
    __setSignedInUser: (user: {uid: string; email: string} | null) => {
      currentUser = user;
    },
    // Firebase has not yet said whether anyone is signed in.
    __holdBack: () => {
      holdBack = true;
    },
  };
});

import App from '../App';
import {checkUserProfileExists} from '../hooks/useProfileCheck';
import {userStore} from '../utils/storage';
import {colors} from '../theme/tokens';

const authMock = require('@react-native-firebase/auth');
const useColorScheme: jest.Mock = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default;

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

const stubComponent = (label: string) => () => {
  const mockReact = require('react');
  const {Text} = require('react-native');
  return mockReact.createElement(Text, null, label);
};
jest.mock('../components/EventPlanner', () => ({__esModule: true, default: stubComponent('PLANNER')}));
jest.mock('../components/DiscoveryFeed', () => ({__esModule: true, default: stubComponent('FEED')}));
jest.mock('../components/SocialDashboard', () => ({__esModule: true, default: stubComponent('SOCIAL')}));
jest.mock('../components/ProfilePage', () => ({__esModule: true, default: stubComponent('PROFILE')}));

const checkMock = checkUserProfileExists as jest.Mock;
const styleOf = (node: {props: {style?: unknown}}) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;
const rendered = () => JSON.stringify(screen.toJSON());

beforeEach(async () => {
  useColorScheme.mockReturnValue('light');
  await userStore.setItem('theme_override', 'system');
});

afterEach(() => {
  jest.clearAllMocks();
  checkMock.mockImplementation(async () => true);
  authMock.__reset();
});

test('on a phone in dark mode, the app opens dark', async () => {
  useColorScheme.mockReturnValue('dark');
  await render(<App />);
  const email = await screen.findByPlaceholderText('EMAIL ADDRESS');
  expect(styleOf(email).backgroundColor).toBe(colors.surfaceAlt.dark);
  expect(styleOf(email).color).toBe(colors.textPrimary.dark);
});

test('on a phone in light mode, the app opens light', async () => {
  await render(<App />);
  const email = await screen.findByPlaceholderText('EMAIL ADDRESS');
  expect(styleOf(email).backgroundColor).toBe(colors.surfaceAlt.light);
  expect(styleOf(email).color).toBe(colors.textPrimary.light);
});

test('while waiting to hear whether anyone is signed in, the Kn logo shows, not a spinner', async () => {
  authMock.__holdBack();
  await render(<App />);
  expect(await screen.findByTestId('launch-logo')).toBeTruthy();
  expect(screen.getByText('Kn')).toBeTruthy();
  expect(rendered()).not.toContain('ActivityIndicator');
  expect(screen.queryByPlaceholderText('EMAIL ADDRESS')).toBeNull();
});

test('while checking that a signed-in user has a profile, the Kn logo shows, not a spinner', async () => {
  let answerCheck!: (exists: boolean) => void;
  checkMock.mockReturnValueOnce(
    new Promise<boolean>(resolve => {
      answerCheck = resolve;
    }),
  );
  authMock.__setSignedInUser({uid: 'test-uid', email: 'a@b.com'});
  await render(<App />);

  expect(await screen.findByTestId('launch-logo')).toBeTruthy();
  expect(screen.getByText('Kn')).toBeTruthy();
  expect(rendered()).not.toContain('ActivityIndicator');

  await act(async () => {
    answerCheck(true);
  });
  expect(screen.getByText('PLANNER')).toBeTruthy();
  expect(screen.queryByTestId('launch-logo')).toBeNull();
});

test('the tab bar follows the theme', async () => {
  useColorScheme.mockReturnValue('dark');
  authMock.__setSignedInUser({uid: 'test-uid', email: 'a@b.com'});
  await render(<App />);
  await screen.findByText('PLANNER');
  const label = (name: string) => styleOf(screen.getByText(name));
  expect(label('Planner').color).toBe(colors.primary.dark);
  expect(label('Search').color).toBe(colors.textDisabled.dark);
});

/**
 * Ticket 4.1: the signed-in app is a five-tab navigator. These tests prove the wiring App.tsx
 * owns — which tabs exist and in what order, that only the tab in front is rendered, that the bar
 * hides while a chat is open, and that "plan this" from Discover or Circle lands on Planner with
 * what was sent.
 *
 * The navigation libraries are the stand-ins from jest.setup.js, and the four screens are stubbed
 * (mounting the real ones hangs in this environment, per jest.setup.js). The tab bar
 * (components/Navigation.tsx) and the Search placeholder are the real components.
 */

import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react-native';

// Same local override as App.profileCheck.test.tsx: sign-in has to cascade onAuthStateChanged for
// the tabs to render at all.
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
  };
});

import App from '../App';

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
  FriendsService: {
    getFriends: jest.fn(async () => []),
    getPendingRequests: jest.fn(async () => []),
    getFriendCounts: jest.fn(async () => ({friends: 0, closeFriends: 0})),
  },
}));
jest.mock('../services/userProfileCache', () => ({
  userProfileCache: {get: jest.fn(async () => null), clear: jest.fn()},
}));

jest.mock('../hooks/useProfileCheck', () => ({
  checkUserProfileExists: jest.fn(async () => true),
  withTimeout: jest.fn((promise: Promise<unknown>) => promise),
  WRITE_TIMEOUT_MS: 15000,
}));

// Each stub shows a marker, echoes the props a test needs to read, and exposes one button per
// callback App hands it.
jest.mock('../components/EventPlanner', () => ({
  __esModule: true,
  default: ({
    initialProposal,
    initialParticipants,
  }: {
    initialProposal?: {title: string} | null;
    initialParticipants?: string[];
  }) => {
    const mockReact = require('react');
    const {Text} = require('react-native');
    return mockReact.createElement(
      mockReact.Fragment,
      null,
      mockReact.createElement(Text, null, 'PLANNER SCREEN'),
      mockReact.createElement(Text, null, `proposal: ${initialProposal ? initialProposal.title : 'none'}`),
      mockReact.createElement(Text, null, `participants: ${(initialParticipants ?? []).join(', ') || 'none'}`),
    );
  },
}));
jest.mock('../components/DiscoveryFeed', () => ({
  __esModule: true,
  default: ({onPlanActivity}: {onPlanActivity: (item: unknown) => void}) => {
    const mockReact = require('react');
    const {Text, TouchableOpacity} = require('react-native');
    return mockReact.createElement(
      mockReact.Fragment,
      null,
      mockReact.createElement(Text, null, 'DISCOVER SCREEN'),
      mockReact.createElement(
        TouchableOpacity,
        {onPress: () => onPlanActivity({id: 'a1', title: 'Sunset Hike', location: 'Ridge Trail'})},
        mockReact.createElement(Text, null, 'DISCOVER: PLAN THIS'),
      ),
    );
  },
}));
jest.mock('../components/SocialDashboard', () => ({
  __esModule: true,
  default: ({
    onChatOpen,
    onChatClose,
    onPlanActivity,
  }: {
    onChatOpen: () => void;
    onChatClose: () => void;
    onPlanActivity: (item: unknown, participants?: string[]) => void;
  }) => {
    const mockReact = require('react');
    const {Text, TouchableOpacity} = require('react-native');
    const button = (label: string, onPress: () => void) =>
      mockReact.createElement(TouchableOpacity, {onPress}, mockReact.createElement(Text, null, label));
    return mockReact.createElement(
      mockReact.Fragment,
      null,
      mockReact.createElement(Text, null, 'CIRCLE SCREEN'),
      button('CIRCLE: OPEN CHAT', onChatOpen),
      button('CIRCLE: CLOSE CHAT', onChatClose),
      button('CIRCLE: PLAN FROM CHAT', () => onPlanActivity(null, ['Sam', 'Jo'])),
    );
  },
}));
jest.mock('../components/ProfilePage', () => ({
  __esModule: true,
  default: ({onLogout}: {onLogout: () => void}) => {
    const mockReact = require('react');
    const {Text, TouchableOpacity} = require('react-native');
    return mockReact.createElement(
      TouchableOpacity,
      {onPress: onLogout},
      mockReact.createElement(Text, null, 'PROFILE SCREEN: LOG OUT'),
    );
  },
}));

afterEach(() => {
  jest.clearAllMocks();
  authMock.__resetAuthMock();
});

const SCREEN_MARKERS = ['PLANNER SCREEN', 'DISCOVER SCREEN', 'CIRCLE SCREEN', 'PROFILE SCREEN: LOG OUT'];

const signIn = async () => {
  await render(<App />);
  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'password123');
  await fireEvent.press(screen.getByText('SIGN IN'));
  await waitFor(() => expect(screen.getByText('PLANNER SCREEN')).toBeTruthy());
};

const tabNames = () => screen.queryAllByRole('tab').map(tab => tab.props.accessibilityLabel);

const goToTab = async (name: string) => {
  await fireEvent.press(screen.getByRole('tab', {name}));
};

test('the tab bar has five tabs in order: Planner, Discover, Search, Circle, Profile', async () => {
  await signIn();

  expect(tabNames()).toEqual(['Planner', 'Discover', 'Search', 'Circle', 'Profile']);
});

test('the app opens on Planner, and Planner is the selected tab', async () => {
  await signIn();

  expect(screen.getByRole('tab', {name: 'Planner', selected: true})).toBeTruthy();
  expect(screen.queryByText('DISCOVER SCREEN')).toBeNull();
});

test.each([
  ['Discover', 'DISCOVER SCREEN'],
  ['Circle', 'CIRCLE SCREEN'],
  ['Profile', 'PROFILE SCREEN: LOG OUT'],
])('the %s tab renders its screen and no other', async (tab, marker) => {
  await signIn();

  await goToTab(tab);

  expect(screen.getByText(marker)).toBeTruthy();
  expect(screen.getByRole('tab', {name: tab, selected: true})).toBeTruthy();
  SCREEN_MARKERS.filter(m => m !== marker).forEach(other => expect(screen.queryByText(other)).toBeNull());
});

test('the Search tab shows the Search banner and none of the other screens', async () => {
  await signIn();
  expect(screen.getAllByText('Search')).toHaveLength(1); // the tab's own label

  await goToTab('Search');

  expect(screen.getAllByText('Search')).toHaveLength(2); // the label and the banner
  SCREEN_MARKERS.forEach(marker => expect(screen.queryByText(marker)).toBeNull());
});

test('coming back to a tab renders it again', async () => {
  await signIn();

  await goToTab('Profile');
  await goToTab('Planner');

  expect(screen.getByText('PLANNER SCREEN')).toBeTruthy();
  expect(screen.queryByText('PROFILE SCREEN: LOG OUT')).toBeNull();
});

test('opening a chat in Circle hides the tab bar; closing it brings the bar back', async () => {
  await signIn();
  await goToTab('Circle');

  await fireEvent.press(screen.getByText('CIRCLE: OPEN CHAT'));
  expect(tabNames()).toEqual([]);
  expect(screen.getByText('CIRCLE SCREEN')).toBeTruthy();

  await fireEvent.press(screen.getByText('CIRCLE: CLOSE CHAT'));
  expect(tabNames()).toEqual(['Planner', 'Discover', 'Search', 'Circle', 'Profile']);
});

test('"plan this" from Discover lands on Planner with the activity', async () => {
  await signIn();
  expect(screen.getByText('proposal: none')).toBeTruthy();
  await goToTab('Discover');

  await fireEvent.press(screen.getByText('DISCOVER: PLAN THIS'));

  expect(screen.getByText('PLANNER SCREEN')).toBeTruthy();
  expect(screen.getByText('proposal: Sunset Hike')).toBeTruthy();
  expect(screen.queryByText('DISCOVER SCREEN')).toBeNull();
  expect(screen.getByRole('tab', {name: 'Planner', selected: true})).toBeTruthy();
});

test('planning from an open chat in Circle lands on Planner with the participants and the bar showing', async () => {
  await signIn();
  await goToTab('Circle');
  await fireEvent.press(screen.getByText('CIRCLE: OPEN CHAT'));

  await fireEvent.press(screen.getByText('CIRCLE: PLAN FROM CHAT'));

  expect(screen.getByText('PLANNER SCREEN')).toBeTruthy();
  expect(screen.getByText('participants: Sam, Jo')).toBeTruthy();
  expect(screen.queryByText('CIRCLE SCREEN')).toBeNull();
  expect(tabNames()).toEqual(['Planner', 'Discover', 'Search', 'Circle', 'Profile']);
});

test('signing out returns to the sign-in screen; signing back in shows the tabs on Planner', async () => {
  await signIn();
  await goToTab('Profile');

  await fireEvent.press(screen.getByText('PROFILE SCREEN: LOG OUT'));
  await waitFor(() => expect(screen.getByText('SIGN IN')).toBeTruthy());
  expect(tabNames()).toEqual([]);

  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'password123');
  await fireEvent.press(screen.getByText('SIGN IN'));

  await waitFor(() => expect(screen.getByText('PLANNER SCREEN')).toBeTruthy());
  expect(screen.getByRole('tab', {name: 'Planner', selected: true})).toBeTruthy();
});

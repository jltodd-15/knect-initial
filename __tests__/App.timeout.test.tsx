/**
 * Ticket 2.3: the signup flow actually bounds the profile write. useProfileCheck.test.ts proves
 * withTimeout works on its own; this proves App uses it. Offline, Firestore's save never finishes
 * (it doesn't fail, it just waits), so without the timeout the button would say "saving" forever.
 *
 * The real withTimeout runs here, with WRITE_TIMEOUT_MS shortened to 50ms so the test doesn't wait
 * 15 real seconds (the 15-second value itself is pinned in useProfileCheck.test.ts). Firestore is
 * mocked underneath it because the real module needs the native app.
 */

import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react-native';
import {act} from 'react-test-renderer';
import App from '../App';
import {UsersRepository} from '../services/UsersRepository';

jest.mock('@react-native-firebase/firestore', () => ({doc: jest.fn(), getDoc: jest.fn()}));
jest.mock('../services/firestore', () => ({db: {}}));
jest.mock('../hooks/useProfileCheck', () => ({
  ...jest.requireActual('../hooks/useProfileCheck'),
  checkUserProfileExists: jest.fn(async () => true),
  WRITE_TIMEOUT_MS: 50,
}));
jest.mock('../services/UsersRepository', () => ({
  UsersRepository: {createUserDocuments: jest.fn(async () => {})},
}));

// Same stub as App.signup.test.tsx: shows the `submitting` prop, and exposes onComplete so the
// test can submit without fireEvent's act() scope staying open for the whole write.
const latestOnComplete: {current: ((profile: unknown, credentials: unknown) => unknown) | null} = {
  current: null,
};
jest.mock('../components/CreateProfilePage', () => ({
  __esModule: true,
  default: ({
    onComplete,
    submitting,
  }: {
    onComplete: (profile: unknown, credentials: unknown) => unknown;
    submitting: string;
  }) => {
    const mockReact = require('react');
    const {Text} = require('react-native');
    latestOnComplete.current = onComplete;
    return mockReact.createElement(Text, null, `SUBMIT STATE: ${submitting}`);
  },
}));

const authMock = require('@react-native-firebase/auth');
const createUserDocuments = UsersRepository.createUserDocuments as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
  authMock.__resetAuthMock();
});

test('a save that never finishes (offline) reaches the "Try Again" state once the timeout passes', async () => {
  createUserDocuments.mockReturnValueOnce(new Promise(() => {})); // never settles, like offline

  await render(<App />);
  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));

  let submitted!: Promise<unknown>;
  act(() => {
    submitted = latestOnComplete.current!(
      {name: 'John Smith', bio: 'Digital nomad', interests: [], profile_picture_url: ''},
      {email: 'john@example.com', password: 'Hunter2-Secret'},
    ) as Promise<unknown>;
  });
  expect(screen.getByText('SUBMIT STATE: submitting')).toBeTruthy();

  // Wait for the submit to finish, but give up after 2 seconds: if the timeout were missing,
  // this fails in 2 seconds with the button still "submitting" instead of hanging the test run.
  await act(async () => {
    await Promise.race([submitted, new Promise<void>(resolve => setTimeout(() => resolve(), 2000))]);
  });

  expect(screen.getByText('SUBMIT STATE: failed')).toBeTruthy();
});

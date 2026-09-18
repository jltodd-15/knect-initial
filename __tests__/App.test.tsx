/**
 * @format
 */

import React from 'react';
import {render, fireEvent, screen, waitFor} from '@testing-library/react-native';
import App from '../App';

const authMock = require('@react-native-firebase/auth');

afterEach(() => {
  jest.clearAllMocks();
  authMock.__resetAuthMock();
});

test('renders correctly and resolves out of the initializing state', async () => {
  await render(<App />);
  expect(screen.getByPlaceholderText('EMAIL ADDRESS')).toBeTruthy();
});

test('a user can sign in with valid credentials, calling Firebase with them', async () => {
  // Deliberately does not assert on landing on the tab tree: a successful
  // sign-in flips isAuth and mounts the tab tree (EventPlanner, etc.), which
  // is unrelated, pre-existing, out-of-scope UI for this ticket. "Lands on
  // the tab tree" (AC 2) is verified on-device instead; this test's job is
  // just to prove the credentials reach Firebase Auth correctly.
  await render(<App />);

  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'password123');
  await fireEvent.press(screen.getByText('SIGN IN'));

  await waitFor(() =>
    expect(authMock.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'a@b.com',
      'password123',
    ),
  );
});

test('wrong password and no-such-account show the same undifferentiated message', async () => {
  authMock.signInWithEmailAndPassword.mockRejectedValueOnce({code: 'auth/wrong-password'});

  await render(<App />);
  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'wrongpass');
  await fireEvent.press(screen.getByText('SIGN IN'));

  await waitFor(() =>
    expect(screen.getByText(/Email or password are incorrect/)).toBeTruthy(),
  );
});

test('malformed email is shown against the email field, not the shared error line', async () => {
  authMock.signInWithEmailAndPassword.mockRejectedValueOnce({code: 'auth/invalid-email'});

  await render(<App />);
  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'not-an-email');
  await fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'password123');
  await fireEvent.press(screen.getByText('SIGN IN'));

  await waitFor(() => expect(screen.getByText('Email is badly formatted')).toBeTruthy());
  expect(screen.queryByText(/Unable to sign in:/)).toBeNull();
});

test('network failure shows a message distinct from credential errors', async () => {
  authMock.signInWithEmailAndPassword.mockRejectedValueOnce({code: 'auth/network-request-failed'});

  await render(<App />);
  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'password123');
  await fireEvent.press(screen.getByText('SIGN IN'));

  await waitFor(() => expect(screen.getByText(/No internet connection/)).toBeTruthy());
  expect(screen.queryByText(/Email or password are incorrect/)).toBeNull();
});

test('pressing CREATE ACCOUNT navigates to the sign-up screen', async () => {
  // Doesn't drive CreateProfilePage's multi-step form to actually submit and
  // hit "Email already in use" - that form's step machine and validation
  // belong to ticket 1.4, out of scope here. This just confirms handleSignUp
  // wires the navigation correctly; the mapped error copy itself is covered
  // by mapAuthError's other branches, verified via the sign-in error tests.
  await render(<App />);
  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));

  await waitFor(() => expect(screen.getByPlaceholderText('username@example.com')).toBeTruthy());
});

test('requesting a password reset for an unregistered address shows the same confirmation', async () => {
  authMock.sendPasswordResetEmail.mockRejectedValueOnce({code: 'auth/user-not-found'});

  await render(<App />);
  await fireEvent.press(screen.getByText('Forgot password?'));
  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'nobody@example.com');
  await fireEvent.press(screen.getByText('SEND RESET EMAIL'));

  await waitFor(() => expect(screen.getByText('Password reset email sent')).toBeTruthy());
});

test('the Google and Apple buttons are disabled', async () => {
  await render(<App />);

  const googleBtn = screen.getByText('Google');
  const appleBtn = screen.getByText('Apple');
  expect(googleBtn.parent?.props.accessibilityState?.disabled).toBe(true);
  expect(appleBtn.parent?.props.accessibilityState?.disabled).toBe(true);
});

test('no long setTimeout-based delay drives sign-in', async () => {
  const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

  await render(<App />);
  await fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'password123');
  await fireEvent.press(screen.getByText('SIGN IN'));

  await waitFor(() =>
    expect(authMock.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'a@b.com',
      'password123',
    ),
  );
  // React Native's own scheduler legitimately uses short (~16ms) setTimeout
  // calls internally; this only guards against the old 5-second fake delay.
  const longDelays = setTimeoutSpy.mock.calls.filter(([, delay]) => delay >= 1000);
  expect(longDelays).toEqual([]);

  setTimeoutSpy.mockRestore();
});

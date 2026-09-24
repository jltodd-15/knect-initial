/**
 * Ticket 2.2: handleProfileComplete calls the Users repository once the auth call has resolved.
 *
 * CreateProfilePage is stubbed: driving its multi-step form is ticket 1.4's, and this test only
 * cares about what App does with the payload it is handed. The repository is mocked (its own
 * behavior is pinned in UsersRepository.test.ts), which also keeps the native Firestore module
 * out of the App import graph.
 */

import React from 'react';
import {render, fireEvent, screen, waitFor} from '@testing-library/react-native';
import App from '../App';
import {UsersRepository} from '../services/UsersRepository';

const authMock = require('@react-native-firebase/auth');

jest.mock('../services/UsersRepository', () => ({
  UsersRepository: {createUserDocuments: jest.fn(async () => {})},
}));

// The stub submits the same shape CreateProfilePage's onComplete sends (CreateProfilePage.tsx:206).
jest.mock('../components/CreateProfilePage', () => {
  const mockReact = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  return {
    __esModule: true,
    default: ({onComplete}: {onComplete: (data: unknown) => void}) =>
      mockReact.createElement(
        TouchableOpacity,
        {
          onPress: () =>
            onComplete({
              name: 'John Smith',
              role: 'Digital nomad',
              interests: ['Board games', 'HIKING'],
              avatar: 'data:image/png;base64,AAAA',
              email: 'john@example.com',
              password: 'hunter2-Secret',
            }),
        },
        mockReact.createElement(Text, null, 'SUBMIT PROFILE'),
      ),
  };
});

const createUserDocuments = UsersRepository.createUserDocuments as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
  authMock.__resetAuthMock();
});

const submitSignUp = async () => {
  await render(<App />);
  await fireEvent.press(screen.getByText('CREATE ACCOUNT'));
  await fireEvent.press(screen.getByText('SUBMIT PROFILE'));
};

test('after the auth account is created, the Users repository is called with its uid and the profile', async () => {
  await submitSignUp();

  await waitFor(() => expect(createUserDocuments).toHaveBeenCalledTimes(1));
  expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    'john@example.com',
    'hunter2-Secret',
  );
  // 'test-uid' is the uid the auth mock hands back: it proves signUp passes the uid through.
  expect(createUserDocuments).toHaveBeenCalledWith('test-uid', {
    name: 'John Smith',
    role: 'Digital nomad',
    interests: ['Board games', 'HIKING'],
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

test('the password and avatar are not handed to the repository', async () => {
  await submitSignUp();

  await waitFor(() => expect(createUserDocuments).toHaveBeenCalled());
  const [, profile] = createUserDocuments.mock.calls[0];
  expect(profile).not.toHaveProperty('password');
  expect(profile).not.toHaveProperty('avatar');
});

test('no repository call is made when the auth account could not be created', async () => {
  authMock.createUserWithEmailAndPassword.mockRejectedValueOnce({code: 'auth/email-already-in-use'});

  await submitSignUp();

  await waitFor(() => expect(screen.getByText(/Email already in use/)).toBeTruthy());
  expect(createUserDocuments).not.toHaveBeenCalled();
});

/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {render, fireEvent, screen, act} from '@testing-library/react-native';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('sign-in does not crash without a native Firebase module, and reports itself unimplemented', async () => {
  jest.useFakeTimers();

  await render(<App />);

  fireEvent.changeText(screen.getByPlaceholderText('EMAIL ADDRESS'), 'a@b.com');
  fireEvent.changeText(screen.getByPlaceholderText('PASSWORD'), 'password');
  fireEvent.press(screen.getByText('SIGN IN'));

  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  expect(screen.getByText(/not yet implemented/i)).toBeTruthy();

  jest.useRealTimers();
});

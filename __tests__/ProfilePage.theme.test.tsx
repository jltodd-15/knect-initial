/**
 * Ticket 4.2: the Profile tab's dark-mode switch reads the theme itself. Turning it on saves Dark,
 * turning it off saves Light, and it shows whichever mode the app is in.
 */

import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react-native';
import ProfilePage from '../components/ProfilePage';
import {ThemeProvider} from '../theme/ThemeProvider';
import {userStore} from '../utils/storage';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}));

const useColorScheme: jest.Mock = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default;

const launch = async () => {
  await render(
    <ThemeProvider>
      <ProfilePage onLogout={() => {}} />
    </ThemeProvider>,
  );
  await screen.findByText('Dark Mode');
};

const darkSwitch = () => screen.getByTestId('dark-mode-switch');

beforeEach(async () => {
  useColorScheme.mockReturnValue('light');
  await userStore.setItem('theme_override', 'system');
});

test('the switch is off on a light phone and on on a dark phone', async () => {
  await launch();
  expect(darkSwitch().props.value).toBe(false);
  await screen.unmount();

  useColorScheme.mockReturnValue('dark');
  await launch();
  expect(darkSwitch().props.value).toBe(true);
});

test('turning the switch on saves Dark; turning it off saves Light', async () => {
  await launch();

  fireEvent(darkSwitch(), 'valueChange', true);
  await waitFor(async () => expect(await userStore.getItem('theme_override')).toBe('dark'));
  await waitFor(() => expect(darkSwitch().props.value).toBe(true));

  fireEvent(darkSwitch(), 'valueChange', false);
  await waitFor(async () => expect(await userStore.getItem('theme_override')).toBe('light'));
  await waitFor(() => expect(darkSwitch().props.value).toBe(false));
});

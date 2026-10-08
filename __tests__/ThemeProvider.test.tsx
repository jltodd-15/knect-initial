/**
 * Ticket 4.2: the theme follows the phone's light/dark setting unless the user has picked Light or
 * Dark, and that pick is saved on the device so it is still in effect after a restart.
 */

import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {render, screen, fireEvent, waitFor} from '@testing-library/react-native';
import {ThemeProvider} from '../theme/ThemeProvider';
import {useTheme} from '../theme/useTheme';
import {userStore} from '../utils/storage';

// The phone's setting, set per test.
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Same in-memory stand-in as jest.setup.js, but one this file can empty between tests and make
// fail on demand. The store outlives a component unmount, which is what "restart" means here.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  const state = {failReads: false};
  return {
    createAsyncStorage: () => ({
      getItem: async (key: string) => {
        if (state.failReads) throw new Error('storage unavailable');
        return store.has(key) ? store.get(key) : null;
      },
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
    }),
    __reset: () => {
      store.clear();
      state.failReads = false;
    },
    __failReads: () => {
      state.failReads = true;
    },
  };
});

const storageMock = jest.requireMock('@react-native-async-storage/async-storage');
const useColorScheme: jest.Mock = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default;
const setPhone = (scheme: 'light' | 'dark' | null) => useColorScheme.mockReturnValue(scheme);

const Probe = () => {
  const theme = useTheme();
  return (
    <>
      <Text testID="mode">{theme.mode}</Text>
      <Text testID="override">{theme.override}</Text>
      <Text testID="background">{theme.colors.background}</Text>
      <TouchableOpacity onPress={() => theme.setOverride('dark')}>
        <Text>pick dark</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => theme.setOverride('light')}>
        <Text>pick light</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => theme.setOverride('system')}>
        <Text>pick system</Text>
      </TouchableOpacity>
    </>
  );
};

const launch = async () => {
  const view = await render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await screen.findByTestId('mode');
  return view;
};

const mode = () => screen.getByTestId('mode').props.children;

beforeEach(() => {
  storageMock.__reset();
  setPhone('light');
});

test('with no override saved, a phone in dark mode gets the dark theme', async () => {
  setPhone('dark');
  await launch();
  expect(mode()).toBe('dark');
  expect(screen.getByTestId('override').props.children).toBe('system');
  expect(screen.getByTestId('background').props.children).toBe('#121212');
});

test('with no override saved, a phone in light mode gets the light theme', async () => {
  await launch();
  expect(mode()).toBe('light');
  expect(screen.getByTestId('background').props.children).toBe('#FDFCFB');
});

test('a phone that reports no setting gets the light theme', async () => {
  setPhone(null);
  await launch();
  expect(mode()).toBe('light');
});

test('with no override saved, the theme follows the phone when its setting changes', async () => {
  const {rerender} = await launch();
  expect(mode()).toBe('light');
  setPhone('dark');
  await rerender(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  expect(mode()).toBe('dark');
});

test('picking Dark overrides a phone in light mode, and is saved', async () => {
  await launch();
  fireEvent.press(screen.getByText('pick dark'));
  await waitFor(() => expect(mode()).toBe('dark'));
  await waitFor(async () => expect(await userStore.getItem('theme_override')).toBe('dark'));
});

test('a saved override is still in effect after the app restarts', async () => {
  const first = await launch();
  fireEvent.press(screen.getByText('pick dark'));
  await waitFor(async () => expect(await userStore.getItem('theme_override')).toBe('dark'));
  await first.unmount();

  await launch();
  expect(mode()).toBe('dark');
  expect(screen.getByTestId('override').props.children).toBe('dark');
});

test('a saved Light override holds on a phone in dark mode', async () => {
  await userStore.setItem('theme_override', 'light');
  setPhone('dark');
  await launch();
  expect(mode()).toBe('light');
});

test('picking System goes back to following the phone, across a restart', async () => {
  await userStore.setItem('theme_override', 'light');
  setPhone('dark');
  const first = await launch();
  fireEvent.press(screen.getByText('pick system'));
  await waitFor(() => expect(mode()).toBe('dark'));
  await waitFor(async () => expect(await userStore.getItem('theme_override')).toBe('system'));
  await first.unmount();

  await launch();
  expect(mode()).toBe('dark');
});

test('a saved value that is not a known override is ignored', async () => {
  await userStore.setItem('theme_override', 'purple');
  setPhone('dark');
  await launch();
  expect(mode()).toBe('dark');
  expect(screen.getByTestId('override').props.children).toBe('system');
});

test('if the saved override cannot be read, the theme follows the phone', async () => {
  storageMock.__failReads();
  setPhone('dark');
  await launch();
  expect(mode()).toBe('dark');
});

test('nothing is drawn until the saved override has been read, so the wrong theme never flashes', async () => {
  await userStore.setItem('theme_override', 'dark');
  const seen: string[] = [];
  const Recorder = () => {
    seen.push(useTheme().mode);
    return null;
  };
  await render(
    <ThemeProvider>
      <Recorder />
    </ThemeProvider>,
  );
  await waitFor(() => expect(seen.length).toBeGreaterThan(0));
  expect(seen).not.toContain('light');
});

test('outside a provider, useTheme gives the light theme', async () => {
  await render(<Probe />);
  expect(mode()).toBe('light');
});

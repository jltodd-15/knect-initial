/**
 * Ticket 4.3: the Search tab — the banner (from 4.1), the search bar, and the result states.
 *
 * The search itself is mocked: what it asks Firestore is pinned in UserSearchService.test.ts and
 * the timing rules in userSearch.test.ts. These tests cover which of the states the screen shows.
 */

import React from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';

const mockSearchUsers = jest.fn();
jest.mock('../services/UserSearchService', () => ({
  UserSearchService: {searchUsers: (...args: unknown[]) => mockSearchUsers(...args)},
}));

import SearchTab from '../components/SearchTab';

const PLACEHOLDER = 'Search for friends...';

// A promise the test settles by hand, to hold the screen in "loading" or answer out of order.
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
};

const type = async (text: string) => {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('search-input'), text);
  });
};
// Lets the 300ms debounce run out and whatever the search resolved with reach the screen.
const settle = async () => {
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockSearchUsers.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

test('shows the Search banner', async () => {
  await render(<SearchTab />);

  expect(screen.getByText('Search')).toBeTruthy();
});

test('the placeholder shows until the bar is selected, and comes back if it is left empty', async () => {
  await render(<SearchTab />);
  const input = screen.getByTestId('search-input');
  expect(input.props.placeholder).toBe(PLACEHOLDER);

  await act(async () => {
    fireEvent(input, 'focus');
  });
  expect(screen.getByTestId('search-input').props.placeholder).toBe('');

  await act(async () => {
    fireEvent(screen.getByTestId('search-input'), 'blur');
  });
  expect(screen.getByTestId('search-input').props.placeholder).toBe(PLACEHOLDER);
});

test('fewer than 3 characters: no search and no results area of any kind', async () => {
  await render(<SearchTab />);

  await type('ky');
  await settle();

  expect(mockSearchUsers).not.toHaveBeenCalled();
  expect(screen.queryByTestId('search-results')).toBeNull();
  expect(screen.queryByTestId('empty-state')).toBeNull();
  expect(screen.queryByTestId('skeleton-list-row')).toBeNull();
});

test('loading shows list-row skeletons, from the third character on', async () => {
  mockSearchUsers.mockReturnValue(deferred().promise);
  await render(<SearchTab />);

  await type('kys');
  expect(screen.getAllByTestId('skeleton-list-row').length).toBeGreaterThan(0);

  await settle();
  expect(mockSearchUsers).toHaveBeenCalledTimes(1);
  expect(screen.getAllByTestId('skeleton-list-row').length).toBeGreaterThan(0);
});

test('success shows one row per person: their initials avatar and their name', async () => {
  mockSearchUsers.mockResolvedValue([
    {uid: 'a', name: 'Kyson Able'},
    {uid: 'b', name: 'kyson baker'},
  ]);
  await render(<SearchTab />);

  await type('kys');
  await settle();

  expect(screen.getAllByTestId('search-result-row')).toHaveLength(2);
  expect(screen.getAllByTestId('initials-avatar')).toHaveLength(2);
  expect(screen.getByText('Kyson Able')).toBeTruthy();
  expect(screen.getByText('kyson baker')).toBeTruthy();
  expect(screen.queryByTestId('skeleton-list-row')).toBeNull();
});

test('a row is not pressable: tapping it does nothing until Project 7', async () => {
  mockSearchUsers.mockResolvedValue([{uid: 'a', name: 'Kyson Able'}]);
  await render(<SearchTab />);

  await type('kys');
  await settle();

  expect(screen.getByTestId('search-result-row').props.onPress).toBeUndefined();
  expect(screen.getByTestId('search-result-row').props.onClick).toBeUndefined();
});

test('no matches shows the empty state "No one found", not the error state', async () => {
  await render(<SearchTab />);

  await type('zzz');
  await settle();

  expect(screen.getByTestId('empty-state')).toBeTruthy();
  expect(screen.getByText('No one found')).toBeTruthy();
  expect(screen.queryByTestId('error-state')).toBeNull();
});

test('a failed search shows the error state, and retry runs the same search again', async () => {
  mockSearchUsers.mockRejectedValueOnce(new Error('unavailable'));
  await render(<SearchTab />);

  await type('kys');
  await settle();
  expect(screen.getByTestId('error-state')).toBeTruthy();
  expect(screen.queryByTestId('empty-state')).toBeNull();

  mockSearchUsers.mockResolvedValue([{uid: 'a', name: 'Kyson Able'}]);
  await act(async () => {
    fireEvent.press(screen.getByTestId('error-state-retry'));
  });

  expect(mockSearchUsers).toHaveBeenCalledTimes(2);
  expect(mockSearchUsers).toHaveBeenLastCalledWith('kys');
  expect(screen.getByText('Kyson Able')).toBeTruthy();
});

test('an older search that answers after a newer one never reaches the screen', async () => {
  const older = deferred<{uid: string; name: string}[]>();
  const newer = deferred<{uid: string; name: string}[]>();
  mockSearchUsers.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
  await render(<SearchTab />);

  await type('kys');
  await settle();
  await type('kyso');
  await settle();
  expect(mockSearchUsers).toHaveBeenCalledTimes(2);

  await act(async () => {
    newer.resolve([{uid: 'n', name: 'Kyson Newer'}]);
  });
  await act(async () => {
    older.resolve([{uid: 'o', name: 'Kys Older'}]);
  });

  expect(screen.getByText('Kyson Newer')).toBeTruthy();
  expect(screen.queryByText('Kys Older')).toBeNull();
});

test('deleting back under 3 characters clears the results, even if an answer is still on its way', async () => {
  const slow = deferred<{uid: string; name: string}[]>();
  mockSearchUsers.mockReturnValueOnce(slow.promise);
  await render(<SearchTab />);

  await type('kys');
  await settle();
  await type('ky');
  await act(async () => {
    slow.resolve([{uid: 'a', name: 'Kyson Able'}]);
  });

  expect(screen.queryByTestId('search-results')).toBeNull();
  expect(screen.queryByText('Kyson Able')).toBeNull();
});

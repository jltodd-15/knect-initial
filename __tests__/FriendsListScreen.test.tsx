/**
 * Ticket 4.6: the friends list on its own screen — a title bar over ticket 4.4's list.
 *
 * The list's own states are pinned in FriendsList.test.tsx. These tests cover what the screen
 * adds: the title, the count, the way back, and its own pull-down refresh.
 */

import React from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';

const mockGetFriends = jest.fn();
const mockClearCache = jest.fn();
jest.mock('../services/FriendsService', () => ({
  FriendsService: {getFriends: (...args: unknown[]) => mockGetFriends(...args)},
}));
jest.mock('../services/userProfileCache', () => ({
  userProfileCache: {get: jest.fn(), clear: (...args: unknown[]) => mockClearCache(...args)},
}));

import FriendsListScreen from '../components/FriendsListScreen';
import {toRow} from '../services/friendsList';

const friend = (uid: string, name: string, status: 'friend' | 'close_friend' = 'friend') =>
  toRow({uid, status}, {name, name_lowercase: name.toLowerCase()});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return {promise, resolve};
};

const onBack = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGetFriends.mockResolvedValue([friend('c', 'Cy Close', 'close_friend'), friend('f', 'Fran Friend')]);
});

test('the title is "Friends", over the list', async () => {
  await render(<FriendsListScreen onBack={onBack} />);

  expect(screen.getByText('Friends')).toBeTruthy();
  expect(screen.getAllByTestId('friend-row')).toHaveLength(2);
  expect(screen.getAllByTestId('friend-star-filled')).toHaveLength(1);
});

test('the title is there while the list is loading, with no count yet', async () => {
  mockGetFriends.mockReturnValue(deferred().promise);
  await render(<FriendsListScreen onBack={onBack} />);

  expect(screen.getByText('Friends')).toBeTruthy();
  expect(screen.getAllByTestId('skeleton-list-row').length).toBeGreaterThan(0);
  expect(screen.queryByTestId('friends-count')).toBeNull();
});

test('once loaded, the number of friends sits beside the title', async () => {
  await render(<FriendsListScreen onBack={onBack} />);

  expect(screen.getByTestId('friends-count')).toHaveTextContent('2');
});

test('opening the screen reads the friends once and leaves the name cache alone', async () => {
  await render(<FriendsListScreen onBack={onBack} />);

  expect(mockGetFriends).toHaveBeenCalledTimes(1);
  expect(mockClearCache).not.toHaveBeenCalled();
});

test('the back arrow goes back', async () => {
  await render(<FriendsListScreen onBack={onBack} />);

  fireEvent.press(screen.getByTestId('friends-back'));

  expect(onBack).toHaveBeenCalledTimes(1);
});

test('with no friends, "Find friends" goes back to the Search tab', async () => {
  mockGetFriends.mockResolvedValue([]);
  await render(<FriendsListScreen onBack={onBack} />);

  fireEvent.press(screen.getByText('Find friends'));

  expect(onBack).toHaveBeenCalledTimes(1);
});

test('pulling down clears the name cache, reads again, and spins until the answer lands', async () => {
  await render(<FriendsListScreen onBack={onBack} />);
  const next = deferred<ReturnType<typeof friend>[]>();
  const order: string[] = [];
  mockClearCache.mockImplementation(() => order.push('clear'));
  mockGetFriends.mockImplementation(() => {
    order.push('friends');
    return next.promise;
  });
  const control = () => screen.getByTestId('friends-list').props.refreshControl.props;

  await act(async () => {
    control().onRefresh();
  });
  expect(order).toEqual(['clear', 'friends']);
  expect(control().refreshing).toBe(true);

  await act(async () => {
    next.resolve([friend('f', 'Fran Renamed')]);
  });
  expect(control().refreshing).toBe(false);
  expect(screen.getByText('Fran Renamed')).toBeTruthy();
  expect(screen.getByTestId('friends-count')).toHaveTextContent('1');
});

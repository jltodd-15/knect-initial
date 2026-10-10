/**
 * Ticket 4.6: the Friends box on the Search tab — two numbers and a way into the list.
 *
 * The count read is mocked: what it asks Firestore is pinned in FriendsService.test.ts and the
 * wording of the line in friendsList.test.ts. These tests cover which state the box shows.
 */

import React from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';

const mockGetFriendCounts = jest.fn();
jest.mock('../services/FriendsService', () => ({
  FriendsService: {getFriendCounts: (...args: unknown[]) => mockGetFriendCounts(...args)},
}));

import FriendsBox from '../components/FriendsBox';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return {promise, resolve};
};

const props = {reloadToken: 0, onOpen: jest.fn()};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetFriendCounts.mockResolvedValue({friends: 12, closeFriends: 2});
});

test('while the counts are on their way, a skeleton row stands in for the box', async () => {
  mockGetFriendCounts.mockReturnValue(deferred().promise);
  await render(<FriendsBox {...props} />);

  expect(screen.getByTestId('skeleton-list-row')).toBeTruthy();
  expect(screen.queryByTestId('friends-box')).toBeNull();
});

test('shows "Friends" and the counts line', async () => {
  await render(<FriendsBox {...props} />);

  expect(screen.getByText('Friends')).toBeTruthy();
  expect(screen.getByTestId('friends-box-counts')).toHaveTextContent('12 friends · 2 close friends');
});

test('with no friends the line says so, and the box is still there to tap', async () => {
  mockGetFriendCounts.mockResolvedValue({friends: 0, closeFriends: 0});
  await render(<FriendsBox {...props} />);

  expect(screen.getByTestId('friends-box-counts')).toHaveTextContent('No friends yet');
  fireEvent.press(screen.getByTestId('friends-box'));
  expect(props.onOpen).toHaveBeenCalledTimes(1);
});

test('tapping the box opens the friends list', async () => {
  await render(<FriendsBox {...props} />);

  fireEvent.press(screen.getByTestId('friends-box'));

  expect(props.onOpen).toHaveBeenCalledTimes(1);
});

test('counts that cannot be read: the box shows without numbers, not an error, and still opens', async () => {
  mockGetFriendCounts.mockRejectedValue(new Error('unavailable'));
  await render(<FriendsBox {...props} />);

  expect(screen.getByText('Friends')).toBeTruthy();
  expect(screen.queryByTestId('friends-box-counts')).toBeNull();
  expect(screen.queryByTestId('error-state')).toBeNull();

  fireEvent.press(screen.getByTestId('friends-box'));
  expect(props.onOpen).toHaveBeenCalledTimes(1);
});

test('a new reload token counts again, keeping the old numbers until the answer lands', async () => {
  const view = await render(<FriendsBox {...props} />);

  const next = deferred<{friends: number; closeFriends: number}>();
  mockGetFriendCounts.mockReturnValue(next.promise);
  await view.rerender(<FriendsBox {...props} reloadToken={1} />);

  expect(mockGetFriendCounts).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId('friends-box-counts')).toHaveTextContent('12 friends · 2 close friends');

  await act(async () => {
    next.resolve({friends: 13, closeFriends: 2});
  });
  expect(screen.getByTestId('friends-box-counts')).toHaveTextContent('13 friends · 2 close friends');
});

test('says when a count has finished, whether it worked or not', async () => {
  const onSettled = jest.fn();
  const view = await render(<FriendsBox {...props} onSettled={onSettled} />);
  expect(onSettled).toHaveBeenCalledTimes(1);

  mockGetFriendCounts.mockRejectedValueOnce(new Error('unavailable'));
  await view.rerender(<FriendsBox {...props} reloadToken={1} onSettled={onSettled} />);
  expect(onSettled).toHaveBeenCalledTimes(2);
});

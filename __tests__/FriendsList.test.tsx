/**
 * Ticket 4.4: the friends list. Since ticket 4.6 it is the body of its own screen, not a section
 * of the Search tab.
 *
 * The read is mocked: what it asks Firestore is pinned in FriendsService.test.ts and the order of
 * the rows in friendsList.test.ts. These tests cover which state the section shows, the stars,
 * and the rows arriving a page at a time.
 */

import React from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';

const mockGetFriends = jest.fn();
jest.mock('../services/FriendsService', () => ({
  FriendsService: {getFriends: (...args: unknown[]) => mockGetFriends(...args)},
}));

import FriendsList from '../components/FriendsList';
import {toRow} from '../services/friendsList';
import {FriendStatus} from '../types';

const friend = (uid: string, name: string | null, status: FriendStatus = 'friend') =>
  toRow({uid, status}, name === null ? null : {name, name_lowercase: name.toLowerCase()});

const many = (count: number) =>
  Array.from({length: count}, (_, index) => friend(`u${index}`, `Friend ${String(index).padStart(2, '0')}`));

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return {promise, resolve};
};

const props = {reloadToken: 0, refreshing: false, onRefresh: jest.fn(), onFindFriends: jest.fn()};

// The list scrolled to its very bottom.
const scrollToEnd = async () => {
  await act(async () => {
    fireEvent.scroll(screen.getByTestId('friends-list'), {
      nativeEvent: {contentOffset: {y: 1000}, contentSize: {height: 1600}, layoutMeasurement: {height: 600}},
    });
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetFriends.mockResolvedValue([]);
});

test('loading shows list-row skeletons', async () => {
  mockGetFriends.mockReturnValue(deferred().promise);
  await render(<FriendsList {...props} />);

  expect(screen.getAllByTestId('skeleton-list-row').length).toBeGreaterThan(0);
});

test('no friends shows the empty state, with an action toward searching', async () => {
  await render(<FriendsList {...props} />);

  expect(screen.getByTestId('empty-state')).toBeTruthy();
  expect(screen.getByText('No friends yet')).toBeTruthy();
  expect(screen.queryByTestId('error-state')).toBeNull();

  fireEvent.press(screen.getByText('Find friends'));
  expect(props.onFindFriends).toHaveBeenCalledTimes(1);
});

test('one row per friend: avatar, name and a star, in the order the read gave', async () => {
  mockGetFriends.mockResolvedValue([friend('c', 'Carol', 'close_friend'), friend('a', 'Ana'), friend('b', 'bob')]);
  await render(<FriendsList {...props} />);

  const rows = screen.getAllByTestId('friend-row');
  expect(rows).toHaveLength(3);
  // A row's text is the avatar's initial followed by the name.
  expect(rows[0]).toHaveTextContent(/Carol$/);
  expect(rows[1]).toHaveTextContent(/Ana$/);
  expect(rows[2]).toHaveTextContent(/bob$/);
  expect(screen.getAllByTestId('initials-avatar')).toHaveLength(3);
  expect(screen.queryByTestId('skeleton-list-row')).toBeNull();
});

test('only the close_friend row gets a filled star; a friend gets an outline', async () => {
  mockGetFriends.mockResolvedValue([friend('c', 'Carol', 'close_friend'), friend('a', 'Ana'), friend('b', 'bob')]);
  await render(<FriendsList {...props} />);

  expect(screen.getAllByTestId('friend-star-filled')).toHaveLength(1);
  expect(screen.getAllByTestId('friend-star-outline')).toHaveLength(2);
  const rows = screen.getAllByTestId('friend-row');
  expect(rows[0]).toContainElement(screen.getByTestId('friend-star-filled'));
});

test('a friend who no longer exists shows "Deleted user" with the person glyph', async () => {
  mockGetFriends.mockResolvedValue([friend('a', 'Ana'), friend('gone', null)]);
  await render(<FriendsList {...props} />);

  expect(screen.getByText('Deleted user')).toBeTruthy();
  expect(screen.getAllByTestId('initials-avatar-fallback')).toHaveLength(1);
});

test('neither a row nor its star is pressable: Project 7 and Project 5', async () => {
  mockGetFriends.mockResolvedValue([friend('c', 'Carol', 'close_friend'), friend('a', 'Ana')]);
  await render(<FriendsList {...props} />);

  [
    ...screen.getAllByTestId('friend-row'),
    screen.getByTestId('friend-star-filled'),
    screen.getByTestId('friend-star-outline'),
  ].forEach(element => {
    expect(element.props.onPress).toBeUndefined();
    expect(element.props.onClick).toBeUndefined();
  });
});

test('a failed read shows the error state, and retry reads again', async () => {
  mockGetFriends.mockRejectedValueOnce(new Error('unavailable'));
  await render(<FriendsList {...props} />);
  expect(screen.getByTestId('error-state')).toBeTruthy();

  mockGetFriends.mockResolvedValue([friend('a', 'Ana')]);
  await act(async () => {
    fireEvent.press(screen.getByTestId('error-state-retry'));
  });

  expect(mockGetFriends).toHaveBeenCalledTimes(2);
  expect(screen.queryByTestId('error-state')).toBeNull();
  expect(screen.getAllByTestId('friend-row')).toHaveLength(1);
});

test('more friends than one page: 10 rows first, 10 more each time the bottom is reached', async () => {
  mockGetFriends.mockResolvedValue(many(23));
  await render(<FriendsList {...props} />);
  expect(screen.getAllByTestId('friend-row')).toHaveLength(10);

  await scrollToEnd();
  expect(screen.getAllByTestId('friend-row')).toHaveLength(20);

  await scrollToEnd();
  expect(screen.getAllByTestId('friend-row')).toHaveLength(23);

  await scrollToEnd();
  expect(screen.getAllByTestId('friend-row')).toHaveLength(23);
});

test('scrolling that is nowhere near the bottom loads nothing', async () => {
  mockGetFriends.mockResolvedValue(many(23));
  await render(<FriendsList {...props} />);

  await act(async () => {
    fireEvent.scroll(screen.getByTestId('friends-list'), {
      nativeEvent: {contentOffset: {y: 0}, contentSize: {height: 1600}, layoutMeasurement: {height: 600}},
    });
  });

  expect(screen.getAllByTestId('friend-row')).toHaveLength(10);
});

// Ticket 4.6: the screen's title shows how many friends there are, from the rows already read.
test('says how many friends it loaded', async () => {
  const onLoaded = jest.fn();
  mockGetFriends.mockResolvedValue([friend('a', 'Ana'), friend('b', 'Bo')]);
  await render(<FriendsList {...props} onLoaded={onLoaded} />);

  expect(onLoaded).toHaveBeenLastCalledWith(2);
});

test('pulling down asks the screen to refresh', async () => {
  await render(<FriendsList {...props} />);

  const {refreshControl} = screen.getByTestId('friends-list').props;
  expect(refreshControl.props.refreshing).toBe(false);
  await act(async () => {
    refreshControl.props.onRefresh();
  });

  expect(props.onRefresh).toHaveBeenCalledTimes(1);
});

test('a new reload token reads again, keeping the rows on screen until the answer lands', async () => {
  mockGetFriends.mockResolvedValue([friend('a', 'Ana')]);
  const view = await render(<FriendsList {...props} />);

  const next = deferred<ReturnType<typeof friend>[]>();
  mockGetFriends.mockReturnValue(next.promise);
  await view.rerender(<FriendsList {...props} reloadToken={1} />);

  expect(mockGetFriends).toHaveBeenCalledTimes(2);
  expect(screen.getByText('Ana')).toBeTruthy();
  expect(screen.queryByTestId('skeleton-list-row')).toBeNull();

  await act(async () => {
    next.resolve([friend('a', 'Ana Renamed')]);
  });
  expect(screen.getByText('Ana Renamed')).toBeTruthy();
});

test('says when a load has finished, whether it worked or not', async () => {
  const onSettled = jest.fn();
  const view = await render(<FriendsList {...props} onSettled={onSettled} />);
  expect(onSettled).toHaveBeenCalledTimes(1);

  mockGetFriends.mockRejectedValueOnce(new Error('unavailable'));
  await view.rerender(<FriendsList {...props} reloadToken={1} onSettled={onSettled} />);
  expect(onSettled).toHaveBeenCalledTimes(2);
});

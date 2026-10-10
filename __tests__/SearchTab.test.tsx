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

// Tickets 4.4 and 4.6: the pending section and the Friends box under the bar read through these.
// What each asks Firestore, and each one's own states, are pinned in the FriendsService,
// PendingRequests and FriendsBox tests.
const mockGetFriends = jest.fn();
const mockGetFriendCounts = jest.fn();
const mockGetPendingRequests = jest.fn();
const mockClearCache = jest.fn();
jest.mock('../services/FriendsService', () => ({
  FriendsService: {
    getFriends: (...args: unknown[]) => mockGetFriends(...args),
    getPendingRequests: (...args: unknown[]) => mockGetPendingRequests(...args),
    getFriendCounts: (...args: unknown[]) => mockGetFriendCounts(...args),
  },
}));
jest.mock('../services/userProfileCache', () => ({
  userProfileCache: {get: jest.fn(), clear: (...args: unknown[]) => mockClearCache(...args)},
}));

import SearchTab from '../components/SearchTab';
import {toRow} from '../services/friendsList';

const FocusContext = jest.requireMock('@react-navigation/native').__FocusContext as React.Context<boolean>;
const person = (uid: string, name: string, status: 'pending' | 'friend' | 'close_friend') =>
  toRow({uid, status}, {name, name_lowercase: name.toLowerCase()});

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
  // Three friends and no requests unless a test says otherwise, so the Friends box is not loading
  // and the search tests above it see only the search's own states.
  mockGetFriends.mockResolvedValue([person('f', 'Fran Friend', 'friend')]);
  mockGetFriendCounts.mockResolvedValue({friends: 3, closeFriends: 1});
  mockGetPendingRequests.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

test('shows the Search banner', async () => {
  await render(<SearchTab onOpenFriends={jest.fn()} />);

  expect(screen.getByText('Search')).toBeTruthy();
});

test('the placeholder shows until the bar is selected, and comes back if it is left empty', async () => {
  await render(<SearchTab onOpenFriends={jest.fn()} />);
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
  await render(<SearchTab onOpenFriends={jest.fn()} />);

  await type('ky');
  await settle();

  expect(mockSearchUsers).not.toHaveBeenCalled();
  expect(screen.queryByTestId('search-results')).toBeNull();
  expect(screen.queryByTestId('empty-state')).toBeNull();
  expect(screen.queryByTestId('skeleton-list-row')).toBeNull();
});

test('loading shows list-row skeletons, from the third character on', async () => {
  mockSearchUsers.mockReturnValue(deferred().promise);
  await render(<SearchTab onOpenFriends={jest.fn()} />);

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
  await render(<SearchTab onOpenFriends={jest.fn()} />);

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
  await render(<SearchTab onOpenFriends={jest.fn()} />);

  await type('kys');
  await settle();

  expect(screen.getByTestId('search-result-row').props.onPress).toBeUndefined();
  expect(screen.getByTestId('search-result-row').props.onClick).toBeUndefined();
});

test('no matches shows the empty state "No one found", not the error state', async () => {
  await render(<SearchTab onOpenFriends={jest.fn()} />);

  await type('zzz');
  await settle();

  expect(screen.getByTestId('empty-state')).toBeTruthy();
  expect(screen.getByText('No one found')).toBeTruthy();
  expect(screen.queryByTestId('error-state')).toBeNull();
});

test('a failed search shows the error state, and retry runs the same search again', async () => {
  mockSearchUsers.mockRejectedValueOnce(new Error('unavailable'));
  await render(<SearchTab onOpenFriends={jest.fn()} />);

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
  await render(<SearchTab onOpenFriends={jest.fn()} />);

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
  await render(<SearchTab onOpenFriends={jest.fn()} />);

  await type('kys');
  await settle();
  await type('ky');
  await act(async () => {
    slow.resolve([{uid: 'a', name: 'Kyson Able'}]);
  });

  expect(screen.queryByTestId('search-results')).toBeNull();
  expect(screen.queryByText('Kyson Able')).toBeNull();
});

describe('the Pending Requests section and the Friends box (tickets 4.4 and 4.6)', () => {
  const COUNTS = '3 friends · 1 close friend';
  const openFriends = jest.fn();

  test('with no search, the pending section and the Friends box sit under the bar', async () => {
    mockGetPendingRequests.mockResolvedValue([person('p', 'Pat Pending', 'pending')]);
    await render(<SearchTab onOpenFriends={openFriends} />);

    expect(screen.getByText('Pending Requests')).toBeTruthy();
    expect(screen.getByTestId('pending-badge')).toHaveTextContent('1');
    expect(screen.getByText('Pat Pending')).toBeTruthy();
    expect(screen.getByText('Friends')).toBeTruthy();
    expect(screen.getByText(COUNTS)).toBeTruthy();
  });

  test('opening the tab never reads the friends themselves: no friend rows, no friends query', async () => {
    await render(<SearchTab onOpenFriends={openFriends} />);

    expect(mockGetFriends).not.toHaveBeenCalled();
    expect(screen.queryByTestId('friend-row')).toBeNull();
    expect(screen.queryByText('Fran Friend')).toBeNull();
  });

  test('tapping the Friends box asks to open the friends list', async () => {
    await render(<SearchTab onOpenFriends={openFriends} />);

    fireEvent.press(screen.getByTestId('friends-box'));

    expect(openFriends).toHaveBeenCalledTimes(1);
  });

  test('zero pending requests: only the Friends box is on screen', async () => {
    await render(<SearchTab onOpenFriends={openFriends} />);

    expect(screen.queryByText('Pending Requests')).toBeNull();
    expect(screen.queryByTestId('pending-section')).toBeNull();
    expect(screen.getByText(COUNTS)).toBeTruthy();
  });

  test('the pending read failing does not blank the Friends box', async () => {
    mockGetPendingRequests.mockRejectedValue(new Error('unavailable'));
    await render(<SearchTab onOpenFriends={openFriends} />);

    expect(screen.getAllByTestId('error-state')).toHaveLength(1);
    expect(screen.getByText(COUNTS)).toBeTruthy();
  });

  test('the counts failing does not blank the pending section, and shows no error', async () => {
    mockGetPendingRequests.mockResolvedValue([person('p', 'Pat Pending', 'pending')]);
    mockGetFriendCounts.mockRejectedValue(new Error('unavailable'));
    await render(<SearchTab onOpenFriends={openFriends} />);

    expect(screen.getByText('Pat Pending')).toBeTruthy();
    expect(screen.getByTestId('friends-box')).toBeTruthy();
    expect(screen.queryByTestId('error-state')).toBeNull();
  });

  test('typing fewer than 3 characters leaves both where they are', async () => {
    await render(<SearchTab onOpenFriends={openFriends} />);

    await type('ky');
    await settle();

    expect(screen.getByText(COUNTS)).toBeTruthy();
  });

  test('while a search is loading or showing results, neither is on screen', async () => {
    mockGetPendingRequests.mockResolvedValue([person('p', 'Pat Pending', 'pending')]);
    mockSearchUsers.mockResolvedValue([{uid: 'a', name: 'Kyson Able'}]);
    await render(<SearchTab onOpenFriends={openFriends} />);

    await type('kys');
    expect(screen.queryByTestId('friends-box')).toBeNull();
    expect(screen.queryByText('Pending Requests')).toBeNull();

    await settle();
    expect(screen.getByText('Kyson Able')).toBeTruthy();
    expect(screen.queryByTestId('friends-box')).toBeNull();
    expect(screen.queryByText(COUNTS)).toBeNull();
    expect(screen.queryByText('Pending Requests')).toBeNull();
    expect(screen.queryByText('Pat Pending')).toBeNull();
  });

  test('clearing the search brings both back', async () => {
    mockGetPendingRequests.mockResolvedValue([person('p', 'Pat Pending', 'pending')]);
    await render(<SearchTab onOpenFriends={openFriends} />);

    await type('kys');
    await settle();
    await type('');
    await settle();

    expect(screen.queryByTestId('search-results')).toBeNull();
    expect(screen.getByText('Pat Pending')).toBeTruthy();
    expect(screen.getByText(COUNTS)).toBeTruthy();
  });

  test('opening the tab runs the pending query and the counts once, and leaves the name cache alone', async () => {
    await render(<SearchTab onOpenFriends={openFriends} />);

    expect(mockGetFriendCounts).toHaveBeenCalledTimes(1);
    expect(mockGetPendingRequests).toHaveBeenCalledTimes(1);
    expect(mockClearCache).not.toHaveBeenCalled();
  });

  test('coming back into focus runs both again, without clearing the name cache', async () => {
    const tab = (focused: boolean) => (
      <FocusContext.Provider value={focused}>
        <SearchTab onOpenFriends={openFriends} />
      </FocusContext.Provider>
    );
    const view = await render(tab(true));

    await view.rerender(tab(false));
    expect(mockGetFriendCounts).toHaveBeenCalledTimes(1);

    mockGetFriendCounts.mockResolvedValue({friends: 4, closeFriends: 1});
    await view.rerender(tab(true));

    expect(mockGetFriendCounts).toHaveBeenCalledTimes(2);
    expect(mockGetPendingRequests).toHaveBeenCalledTimes(2);
    expect(mockClearCache).not.toHaveBeenCalled();
    expect(screen.getByText('4 friends · 1 close friend')).toBeTruthy();
  });

  test('pulling down clears the name cache, then runs both again', async () => {
    await render(<SearchTab onOpenFriends={openFriends} />);
    const order: string[] = [];
    mockClearCache.mockImplementation(() => order.push('clear'));
    mockGetFriendCounts.mockImplementation(async () => {
      order.push('counts');
      return {friends: 5, closeFriends: 0};
    });
    mockGetPendingRequests.mockImplementation(async () => {
      order.push('pending');
      return [];
    });

    await act(async () => {
      screen.getByTestId('search-home').props.refreshControl.props.onRefresh();
    });

    expect(order[0]).toBe('clear');
    expect(order.slice().sort()).toEqual(['clear', 'counts', 'pending']);
    expect(screen.getByText('5 friends')).toBeTruthy();
  });

  test('the pull-down spinner shows until both have answered', async () => {
    await render(<SearchTab onOpenFriends={openFriends} />);
    const counts = deferred<{friends: number; closeFriends: number}>();
    const pending = deferred<ReturnType<typeof person>[]>();
    mockGetFriendCounts.mockReturnValue(counts.promise);
    mockGetPendingRequests.mockReturnValue(pending.promise);
    const spinning = () => screen.getByTestId('search-home').props.refreshControl.props.refreshing;

    await act(async () => {
      screen.getByTestId('search-home').props.refreshControl.props.onRefresh();
    });
    expect(spinning()).toBe(true);

    await act(async () => {
      counts.resolve({friends: 0, closeFriends: 0});
    });
    expect(spinning()).toBe(true);

    await act(async () => {
      pending.reject(new Error('unavailable'));
    });
    expect(spinning()).toBe(false);
  });
});

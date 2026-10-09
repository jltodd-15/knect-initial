/**
 * Ticket 4.4: the Pending Requests section of the Search tab.
 *
 * The read is mocked: what it asks Firestore is pinned in FriendsService.test.ts and the order of
 * the rows in friendsList.test.ts. These tests cover which state the section shows, and above all
 * that with no requests it is not on the screen at all.
 */

import React from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';

const mockGetPendingRequests = jest.fn();
jest.mock('../services/FriendsService', () => ({
  FriendsService: {getPendingRequests: (...args: unknown[]) => mockGetPendingRequests(...args)},
}));

import PendingRequests from '../components/PendingRequests';
import {toRow} from '../services/friendsList';

const pending = (uid: string, name: string | null) =>
  toRow({uid, status: 'pending'}, name === null ? null : {name, name_lowercase: name.toLowerCase()});

const THREE = [pending('a', 'Ana Diaz'), pending('b', 'Bob Ray'), pending('c', 'Cy Young')];

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return {promise, resolve};
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPendingRequests.mockResolvedValue([]);
});

test('loading shows list-row skeletons', async () => {
  mockGetPendingRequests.mockReturnValue(deferred().promise);
  await render(<PendingRequests reloadToken={0} />);

  expect(screen.getAllByTestId('skeleton-list-row').length).toBeGreaterThan(0);
});

test('zero pending requests: the section is absent, not rendered empty', async () => {
  await render(<PendingRequests reloadToken={0} />);

  expect(screen.toJSON()).toBeNull();
  expect(screen.queryByText('Pending Requests')).toBeNull();
  expect(screen.queryByTestId('empty-state')).toBeNull();
});

test('three pending requests: three rows of avatar and name, and the badge reads "3"', async () => {
  mockGetPendingRequests.mockResolvedValue(THREE);
  await render(<PendingRequests reloadToken={0} />);

  expect(screen.getByText('Pending Requests')).toBeTruthy();
  expect(screen.getByTestId('pending-badge')).toHaveTextContent('3');
  expect(screen.getAllByTestId('pending-row')).toHaveLength(3);
  expect(screen.getAllByTestId('initials-avatar')).toHaveLength(3);
  expect(screen.getByText('Ana Diaz')).toBeTruthy();
  expect(screen.queryByTestId('skeleton-list-row')).toBeNull();
});

test('a request from someone who no longer exists shows "Deleted user" with the person glyph', async () => {
  mockGetPendingRequests.mockResolvedValue([pending('gone', null)]);
  await render(<PendingRequests reloadToken={0} />);

  expect(screen.getByText('Deleted user')).toBeTruthy();
  expect(screen.getByTestId('initials-avatar-fallback')).toBeTruthy();
});

test('a row is not pressable: accepting and declining are Project 5', async () => {
  mockGetPendingRequests.mockResolvedValue([pending('a', 'Ana Diaz')]);
  await render(<PendingRequests reloadToken={0} />);

  expect(screen.getByTestId('pending-row').props.onPress).toBeUndefined();
  expect(screen.getByTestId('pending-row').props.onClick).toBeUndefined();
});

test('a failed read shows the error state, and retry reads again', async () => {
  mockGetPendingRequests.mockRejectedValueOnce(new Error('unavailable'));
  await render(<PendingRequests reloadToken={0} />);
  expect(screen.getByTestId('error-state')).toBeTruthy();

  mockGetPendingRequests.mockResolvedValue(THREE);
  await act(async () => {
    fireEvent.press(screen.getByTestId('error-state-retry'));
  });

  expect(mockGetPendingRequests).toHaveBeenCalledTimes(2);
  expect(screen.queryByTestId('error-state')).toBeNull();
  expect(screen.getAllByTestId('pending-row')).toHaveLength(3);
});

test('a new reload token reads again, keeping the rows on screen until the answer lands', async () => {
  mockGetPendingRequests.mockResolvedValue(THREE);
  const view = await render(<PendingRequests reloadToken={0} />);

  const next = deferred<typeof THREE>();
  mockGetPendingRequests.mockReturnValue(next.promise);
  await view.rerender(<PendingRequests reloadToken={1} />);

  expect(mockGetPendingRequests).toHaveBeenCalledTimes(2);
  expect(screen.getAllByTestId('pending-row')).toHaveLength(3);
  expect(screen.queryByTestId('skeleton-list-row')).toBeNull();

  await act(async () => {
    next.resolve([THREE[0]]);
  });
  expect(screen.getAllByTestId('pending-row')).toHaveLength(1);
  expect(screen.getByTestId('pending-badge')).toHaveTextContent('1');
});

test('says when a load has finished, whether it worked or not', async () => {
  const onSettled = jest.fn();
  const view = await render(<PendingRequests reloadToken={0} onSettled={onSettled} />);
  expect(onSettled).toHaveBeenCalledTimes(1);

  mockGetPendingRequests.mockRejectedValueOnce(new Error('unavailable'));
  await view.rerender(<PendingRequests reloadToken={1} onSettled={onSettled} />);
  expect(onSettled).toHaveBeenCalledTimes(2);
});

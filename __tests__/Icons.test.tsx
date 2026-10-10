/**
 * Ticket 4.5, part C: icons come from Lucide, at the design's stroke width.
 *
 * The library itself is replaced by the stand-in in jest.setup.js, so these tests prove which icon
 * a screen asks for and at what size and stroke. Whether the real library loads and how the icons
 * look is only checkable on a device (DEVICE_TESTS.md, 4.5).
 */

import React from 'react';
import {render, screen} from '@testing-library/react-native';
import design from '../docs/design/tokens.json';

import Navigation from '../components/Navigation';
import FriendsBox from '../components/FriendsBox';
import FriendsListScreen from '../components/FriendsListScreen';
import InitialsAvatar from '../components/InitialsAvatar';
import {toRow} from '../services/friendsList';

const mockGetFriends = jest.fn();
const mockGetFriendCounts = jest.fn();
jest.mock('../services/FriendsService', () => ({
  FriendsService: {
    getFriends: (...args: unknown[]) => mockGetFriends(...args),
    getFriendCounts: (...args: unknown[]) => mockGetFriendCounts(...args),
  },
}));
jest.mock('../services/userProfileCache', () => ({userProfileCache: {get: jest.fn(), clear: jest.fn()}}));

const STROKE = design.icons.strokeWidth;

// App.tsx's five tabs, as the navigator hands them to the bar.
const TABS = ['Planner', 'Discover', 'Search', 'Circle', 'Profile'];
const tabBar = (
  <Navigation
    {...({
      state: {index: 0, routes: TABS.map(name => ({key: `${name}-key`, name}))},
      navigation: {emit: () => ({defaultPrevented: false}), navigate: jest.fn()},
      descriptors: {},
      insets: {top: 0, right: 0, bottom: 0, left: 0},
    } as unknown as React.ComponentProps<typeof Navigation>)}
  />
);

beforeEach(() => {
  mockGetFriends.mockResolvedValue([toRow({uid: 'c', status: 'close_friend'}, {name: 'Cy', name_lowercase: 'cy'})]);
  mockGetFriendCounts.mockResolvedValue({friends: 1, closeFriends: 1});
});

test.each([
  ['Planner', 'calendar'],
  ['Discover', 'compass'],
  ['Search', 'search'],
  ['Circle', 'users'],
  ['Profile', 'user'],
])('the %s tab shows the %s icon, at the tab size and the design stroke', async (tab, icon) => {
  await render(tabBar);

  const drawn = screen.getByTestId(`tab-icon-${tab}`);
  expect(drawn.props.name).toBe(icon);
  expect(drawn.props.size).toBe(design.icons.sizes.tab);
  expect(drawn.props.strokeWidth).toBe(STROKE);
});

test('the Friends box points right with a chevron', async () => {
  await render(<FriendsBox reloadToken={0} onOpen={jest.fn()} />);

  const chevron = screen.getByTestId('friends-box-chevron');
  expect(chevron.props.name).toBe('chevron-right');
  expect(chevron.props.strokeWidth).toBe(STROKE);
});

test('the friends list goes back with a left chevron, and stars are the star icon', async () => {
  await render(<FriendsListScreen onBack={jest.fn()} />);

  expect(screen.getByTestId('friends-back-icon').props.name).toBe('chevron-left');
  const star = screen.getByTestId('friend-star-filled');
  expect(star.props.name).toBe('star');
  expect(star.props.strokeWidth).toBe(STROKE);
});

test('a person with no name shows the user icon', async () => {
  await render(<InitialsAvatar name="" size={48} />);

  expect(screen.getByTestId('initials-avatar-fallback').props.name).toBe('user');
});

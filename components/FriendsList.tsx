import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import InitialsAvatar from './InitialsAvatar';
import EmptyState from './shared/EmptyState';
import ErrorState from './shared/ErrorState';
import SkeletonCard from './shared/SkeletonCard';
import { FriendsService } from '../services/FriendsService';
import { FriendRow, isStarFilled, pageOf } from '../services/friendsList';
import { createLatestTracker } from '../services/userSearch';

// Ticket 4.4: my friends, on the Search tab. Display only: starring is Project 5 and opening a
// person is Project 7. This is also the tab's scrolling list, so whatever sits above the friends
// (the Pending Requests section) is handed in as `header` and scrolls with them.

const SKELETON_ROWS = 3;
// The skeleton row's avatar size, so a row doesn't shift when it replaces its skeleton.
const AVATAR_SIZE = 48;
const STAR_SIZE = 20;
// How close to the bottom counts as reaching it.
const END_THRESHOLD = 120;

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; rows: FriendRow[] };

interface Props {
  // A new value reads again: the tab came back into focus, or was pulled down.
  reloadToken: number;
  refreshing: boolean;
  onRefresh: () => void;
  onFindFriends: () => void;
  onSettled?: () => void;
  header?: React.ReactNode;
}

// Filled for a close friend, outline for a friend. Not a button: starring is Project 5.
const Star: React.FC<{ filled: boolean; color: string }> = ({ filled, color }) => (
  <Svg
    testID={filled ? 'friend-star-filled' : 'friend-star-outline'}
    width={STAR_SIZE}
    height={STAR_SIZE}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color}
    strokeWidth="2"
    strokeLinejoin="round"
  >
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const FriendsList: React.FC<Props> = ({ reloadToken, refreshing, onRefresh, onFindFriends, onSettled, header }) => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [pages, setPages] = useState(1);

  const tracker = useRef(createLatestTracker()).current;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const load = useCallback(async () => {
    const ticket = tracker.start();
    // Rows already on screen stay there while the new answer is on its way.
    setState((current) => (current.status === 'loaded' ? current : { status: 'loading' }));
    try {
      const rows = await FriendsService.getFriends();
      if (!tracker.isLatest(ticket)) return;
      setState({ status: 'loaded', rows });
    } catch {
      if (!tracker.isLatest(ticket)) return;
      setState({ status: 'error' });
    }
    onSettledRef.current?.();
  }, [tracker]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  // Leaving the screen ignores an answer that is still on its way.
  useEffect(() => () => tracker.invalidate(), [tracker]);

  // Every name is already read (sorting needs them all); paging only limits how many rows are drawn.
  const { visible, hasMore } = pageOf(state.status === 'loaded' ? state.rows : [], pages);

  const viewportHeight = useRef(0);
  const showMoreIfAtEnd = (offsetY: number, contentHeight: number, layoutHeight: number) => {
    if (hasMore && offsetY + layoutHeight >= contentHeight - END_THRESHOLD) setPages((current) => current + 1);
  };
  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) =>
    showMoreIfAtEnd(nativeEvent.contentOffset.y, nativeEvent.contentSize.height, nativeEvent.layoutMeasurement.height);
  // A page that doesn't fill the screen can't be scrolled, so it is topped up as soon as it is measured.
  const handleLayout = (event: LayoutChangeEvent) => {
    viewportHeight.current = event.nativeEvent.layout.height;
  };
  const handleContentSizeChange = (_width: number, contentHeight: number) => {
    if (viewportHeight.current > 0 && contentHeight <= viewportHeight.current) {
      showMoreIfAtEnd(0, contentHeight, viewportHeight.current);
    }
  };

  return (
    <ScrollView
      testID="friends-list"
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={100}
      onScroll={handleScroll}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {header}
      <View style={styles.heading}>
        <Text style={styles.headingText}>Friends</Text>
      </View>
      {state.status === 'loading' &&
        Array.from({ length: SKELETON_ROWS }, (_, index) => <SkeletonCard key={index} variant="list-row" />)}
      {state.status === 'error' && <ErrorState onRetry={load} />}
      {state.status === 'loaded' && state.rows.length === 0 && (
        <EmptyState message="No friends yet" actionLabel="Find friends" onAction={onFindFriends} />
      )}
      {visible.map((person) => (
        // A plain View on purpose: tapping a row does nothing until Project 7.
        <View key={person.uid} testID="friend-row" style={styles.row}>
          <InitialsAvatar name={person.avatarName} size={AVATAR_SIZE} />
          <Text style={styles.rowName} numberOfLines={1}>{person.name}</Text>
          <Star filled={isStarFilled(person.status)} color={theme.colors.primary} />
        </View>
      ))}
    </ScrollView>
  );
};

const getStyles = ({ colors, typography, spacing }: Theme) => StyleSheet.create({
  heading: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.xs },
  headingText: { ...typography.label, color: colors.textSecondary, fontFamily: 'Inter' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md },
  rowName: { ...typography.body, flex: 1, color: colors.textPrimary, fontFamily: 'Inter' },
});

export default FriendsList;

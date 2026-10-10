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
import { Star } from 'lucide-react-native';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import InitialsAvatar from './InitialsAvatar';
import EmptyState from './shared/EmptyState';
import ErrorState from './shared/ErrorState';
import SkeletonCard from './shared/SkeletonCard';
import { FriendsService } from '../services/FriendsService';
import { FriendRow, isStarFilled, pageOf } from '../services/friendsList';
import { createLatestTracker } from '../services/userSearch';

// Ticket 4.4: my friends. Display only: starring is Project 5 and opening a person is Project 7.
// Since ticket 4.6 this is the body of its own screen (FriendsListScreen), not part of the Search tab.

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
  // A new value reads again: the list was pulled down.
  reloadToken: number;
  refreshing: boolean;
  onRefresh: () => void;
  onFindFriends: () => void;
  onSettled?: () => void;
  // How many friends the last successful read found.
  onLoaded?: (count: number) => void;
}

// Filled for a close friend, outline for a friend. Not a button: starring is Project 5.
const FriendStar: React.FC<{ filled: boolean; color: string; strokeWidth: number }> = ({ filled, color, strokeWidth }) => (
  <Star
    testID={filled ? 'friend-star-filled' : 'friend-star-outline'}
    size={STAR_SIZE}
    color={color}
    fill={filled ? color : 'none'}
    strokeWidth={strokeWidth}
  />
);

const FriendsList: React.FC<Props> = ({ reloadToken, refreshing, onRefresh, onFindFriends, onSettled, onLoaded }) => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [pages, setPages] = useState(1);

  const tracker = useRef(createLatestTracker()).current;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const load = useCallback(async () => {
    const ticket = tracker.start();
    // Rows already on screen stay there while the new answer is on its way.
    setState((current) => (current.status === 'loaded' ? current : { status: 'loading' }));
    try {
      const rows = await FriendsService.getFriends();
      if (!tracker.isLatest(ticket)) return;
      setState({ status: 'loaded', rows });
      onLoadedRef.current?.(rows.length);
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
          <FriendStar filled={isStarFilled(person.status)} color={theme.colors.primary} strokeWidth={theme.icons.strokeWidth} />
        </View>
      ))}
    </ScrollView>
  );
};

const getStyles = ({ colors, typography, spacing }: Theme) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md },
  rowName: { ...typography.body, flex: 1, color: colors.textPrimary, fontFamily: 'Manrope' },
});

export default FriendsList;

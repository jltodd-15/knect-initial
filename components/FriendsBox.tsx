import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import SkeletonCard from './shared/SkeletonCard';
import { FriendsService } from '../services/FriendsService';
import { FriendCounts, friendCountsLabel } from '../services/friendsList';
import { createLatestTracker } from '../services/userSearch';

// Ticket 4.6: the Friends box on the Search tab. Two counts and a way into the friends list, which
// is its own screen, so opening the Search tab never reads the friends themselves.

const CHEVRON_SIZE = 20;
// The row height on the Search board (docs/design/app-screens/Search).
const BOX_HEIGHT = 60;

type CountState =
  | { status: 'loading' }
  // Counts need a connection. Without them the box still shows and still opens the list.
  | { status: 'unavailable' }
  | { status: 'loaded'; counts: FriendCounts };

interface Props {
  // A new value counts again: the tab came back into focus, or was pulled down.
  reloadToken: number;
  onOpen: () => void;
  onSettled?: () => void;
}

const FriendsBox: React.FC<Props> = ({ reloadToken, onOpen, onSettled }) => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [state, setState] = useState<CountState>({ status: 'loading' });

  const tracker = useRef(createLatestTracker()).current;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const load = useCallback(async () => {
    const ticket = tracker.start();
    // Numbers already on screen stay there while the new answer is on its way.
    setState((current) => (current.status === 'loaded' ? current : { status: 'loading' }));
    try {
      const counts = await FriendsService.getFriendCounts();
      if (!tracker.isLatest(ticket)) return;
      setState({ status: 'loaded', counts });
    } catch {
      if (!tracker.isLatest(ticket)) return;
      setState({ status: 'unavailable' });
    }
    onSettledRef.current?.();
  }, [tracker]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  // Leaving the screen ignores an answer that is still on its way.
  useEffect(() => () => tracker.invalidate(), [tracker]);

  if (state.status === 'loading') return <SkeletonCard variant="list-row" />;

  return (
    <Pressable
      testID="friends-box"
      accessibilityRole="button"
      accessibilityLabel="Friends"
      onPress={onOpen}
      style={({ pressed }) => [styles.box, pressed && styles.boxPressed]}
    >
      <View style={styles.text}>
        <Text style={styles.title}>Friends</Text>
        {state.status === 'loaded' && (
          <Text testID="friends-box-counts" style={styles.counts} numberOfLines={1}>
            {friendCountsLabel(state.counts)}
          </Text>
        )}
      </View>
      <Svg
        width={CHEVRON_SIZE}
        height={CHEVRON_SIZE}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors.textSecondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="m9 18 6-6-6-6" />
      </Svg>
    </Pressable>
  );
};

const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: BOX_HEIGHT,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  boxPressed: { backgroundColor: colors.surfaceAlt },
  text: { flex: 1 },
  title: { ...typography.body, color: colors.textPrimary, fontFamily: 'Manrope' },
  counts: { ...typography.caption, color: colors.textSecondary, fontFamily: 'Manrope' },
});

export default FriendsBox;

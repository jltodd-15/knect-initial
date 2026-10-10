import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import InitialsAvatar from './InitialsAvatar';
import ErrorState from './shared/ErrorState';
import SkeletonCard from './shared/SkeletonCard';
import { FriendsService } from '../services/FriendsService';
import { FriendRow, badgeCount } from '../services/friendsList';
import { createLatestTracker } from '../services/userSearch';

// Ticket 4.4: the requests other people have sent me, on the Search tab. Display only: accepting
// and declining are Project 5. With no requests the section is not on the screen at all.

const SKELETON_ROWS = 3;
// The skeleton row's avatar size, so a row doesn't shift when it replaces its skeleton.
const AVATAR_SIZE = 48;

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; rows: FriendRow[] };

interface Props {
  // A new value reads again: the tab came back into focus, or was pulled down.
  reloadToken: number;
  onSettled?: () => void;
}

const PendingRequests: React.FC<Props> = ({ reloadToken, onSettled }) => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const tracker = useRef(createLatestTracker()).current;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const load = useCallback(async () => {
    const ticket = tracker.start();
    // Rows already on screen stay there while the new answer is on its way.
    setState((current) => (current.status === 'loaded' ? current : { status: 'loading' }));
    try {
      const rows = await FriendsService.getPendingRequests();
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

  if (state.status === 'loading') {
    return (
      <View>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => <SkeletonCard key={index} variant="list-row" />)}
      </View>
    );
  }
  if (state.status === 'error') return <ErrorState onRetry={load} />;
  if (state.rows.length === 0) return null;

  return (
    <View testID="pending-section">
      <View style={styles.heading}>
        <Text style={styles.headingText}>Pending Requests</Text>
        <View style={styles.badge}>
          <Text testID="pending-badge" style={styles.badgeText}>{badgeCount(state.rows)}</Text>
        </View>
      </View>
      {state.rows.map((person) => (
        // A plain View on purpose: tapping a row does nothing until Project 7.
        <View key={person.uid} testID="pending-row" style={styles.row}>
          <InitialsAvatar name={person.avatarName} size={AVATAR_SIZE} />
          <Text style={styles.rowName} numberOfLines={1}>{person.name}</Text>
        </View>
      ))}
    </View>
  );
};

const BADGE_SIZE = 18;

const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  headingText: { ...typography.label, color: colors.textSecondary, fontFamily: 'Manrope' },
  badge: {
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...typography.micro, color: colors.onDanger, fontFamily: 'Manrope' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md },
  rowName: { ...typography.body, flex: 1, color: colors.textPrimary, fontFamily: 'Manrope' },
});

export default PendingRequests;

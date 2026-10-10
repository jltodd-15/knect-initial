import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import FriendsList from './FriendsList';
import { userProfileCache } from '../services/userProfileCache';

// Ticket 4.6: the friends list on its own screen, opened from the Friends box on the Search tab.
// A title bar over ticket 4.4's list. This is where each friend's name is read, not the Search tab.

const BACK_ICON_SIZE = 24;
// The smallest comfortable tap target.
const BACK_TARGET = 44;

interface Props {
  onBack: () => void;
}

const FriendsListScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [reloadToken, setReloadToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // From the rows the list has already read, so the title costs no extra query.
  const [count, setCount] = useState<number | null>(null);

  // Pull down: the cache is cleared first, so names are read again too. That is how a friend's
  // changed name shows up.
  const handleRefresh = () => {
    userProfileCache.clear();
    setRefreshing(true);
    setReloadToken((token) => token + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          testID="friends-back"
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={styles.back}
        >
          <Svg
            width={BACK_ICON_SIZE}
            height={BACK_ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.textPrimary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="m15 18-6-6 6-6" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>Friends</Text>
        {count !== null && <Text testID="friends-count" style={styles.count}>{count}</Text>}
      </View>
      <FriendsList
        reloadToken={reloadToken}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onSettled={() => setRefreshing(false)}
        onLoaded={setCount}
        // The way to find friends is the search bar, which is on the screen underneath.
        onFindFriends={onBack}
      />
    </View>
  );
};

const getStyles = ({ colors, typography, spacing }: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  back: { width: BACK_TARGET, height: BACK_TARGET, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.headline, color: colors.textPrimary, fontFamily: 'Inter' },
  count: { ...typography.body, color: colors.textSecondary, fontFamily: 'Inter' },
});

export default FriendsListScreen;

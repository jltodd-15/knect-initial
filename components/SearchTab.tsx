import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import InitialsAvatar from './InitialsAvatar';
import FriendsBox from './FriendsBox';
import PendingRequests from './PendingRequests';
import EmptyState from './shared/EmptyState';
import ErrorState from './shared/ErrorState';
import SkeletonCard from './shared/SkeletonCard';
import { UserSearchService } from '../services/UserSearchService';
import { UserSearchResult, createLatestTracker, createSearchScheduler, isSearchable } from '../services/userSearch';
import { userProfileCache } from '../services/userProfileCache';

// Ticket 4.3: look people up by the start of their name. The rules for when a search runs and
// which answer counts are in services/userSearch.ts; this screen shows the state they produce.
//
// Tickets 4.4 and 4.6: with no search showing, the Pending Requests section and the Friends box sit
// under the bar. The box holds two counts and opens the friends list on its own screen, so opening
// this tab never reads the friends themselves. A search works like opening a separate page: while
// it is loading or showing results both are gone, and clearing it brings them back.

const PLACEHOLDER = 'Search for friends...';
const SKELETON_ROWS = 3;
// The skeleton row's avatar size, so a row doesn't shift when it replaces its skeleton.
const AVATAR_SIZE = 48;

// The pending section and the Friends box each say when their read has finished.
const SECTIONS = 2;

type SearchState =
  // Fewer than 3 characters: no results area at all, and the two sections show instead.
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'results'; results: UserSearchResult[] };

interface Props {
  onOpenFriends: () => void;
}

const SearchTab: React.FC<Props> = ({ onOpenFriends }) => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [state, setState] = useState<SearchState>({ status: 'idle' });

  const tracker = useRef(createLatestTracker()).current;

  const runSearch = useRef(async (searchText: string) => {
    const ticket = tracker.start();
    setState({ status: 'loading' });
    try {
      const results = await UserSearchService.searchUsers(searchText);
      if (tracker.isLatest(ticket)) setState({ status: 'results', results });
    } catch {
      if (tracker.isLatest(ticket)) setState({ status: 'error' });
    }
  }).current;

  const scheduler = useRef(createSearchScheduler(runSearch, () => setState({ status: 'idle' }))).current;

  // Leaving the screen drops a search that is waiting and ignores one that is on its way.
  useEffect(() => () => {
    scheduler.cancel();
    tracker.invalidate();
  }, [scheduler, tracker]);

  // The pending section and the Friends box read again whenever this changes. They read once when
  // they appear; after that, each time the tab comes back into focus (names come from the session
  // cache) and each pull down. Today App.tsx rebuilds this screen on every visit, so the focus case is covered by
  // "when they appear" - this keeps it true if the screen is ever kept alive between visits.
  const [reloadToken, setReloadToken] = useState(0);
  const isFocused = useIsFocused();
  const wasFocused = useRef(isFocused);
  useEffect(() => {
    if (isFocused && !wasFocused.current) setReloadToken((token) => token + 1);
    wasFocused.current = isFocused;
  }, [isFocused]);

  // Pull down: the cache is cleared first, so names are read again too. That is how a changed
  // name shows up. The spinner stays until both have answered.
  const [refreshing, setRefreshing] = useState(false);
  const sectionsToSettle = useRef(0);
  const handleRefresh = () => {
    userProfileCache.clear();
    sectionsToSettle.current = SECTIONS;
    setRefreshing(true);
    setReloadToken((token) => token + 1);
  };
  const handleSectionSettled = () => {
    if (sectionsToSettle.current === 0) return;
    sectionsToSettle.current -= 1;
    if (sectionsToSettle.current === 0) setRefreshing(false);
  };

  const handleChangeText = (next: string) => {
    setText(next);
    // The text has changed, so an answer still on its way is for something no longer typed.
    tracker.invalidate();
    if (isSearchable(next)) {
      setState({ status: 'loading' });
      // The sections are about to leave the screen, and with them any refresh in progress.
      sectionsToSettle.current = 0;
      setRefreshing(false);
    }
    scheduler.input(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <TextInput
        testID="search-input"
        style={styles.searchBar}
        value={text}
        onChangeText={handleChangeText}
        placeholder={focused ? '' : PLACEHOLDER}
        placeholderTextColor={theme.colors.placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {state.status === 'idle' ? (
        <ScrollView
          testID="search-home"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
        >
          <PendingRequests reloadToken={reloadToken} onSettled={handleSectionSettled} />
          <FriendsBox reloadToken={reloadToken} onSettled={handleSectionSettled} onOpen={onOpenFriends} />
        </ScrollView>
      ) : (
        <ScrollView testID="search-results" keyboardShouldPersistTaps="handled">
          {state.status === 'loading' &&
            Array.from({ length: SKELETON_ROWS }, (_, index) => <SkeletonCard key={index} variant="list-row" />)}
          {state.status === 'error' && <ErrorState onRetry={() => runSearch(text)} />}
          {state.status === 'results' && state.results.length === 0 && <EmptyState message="No one found" />}
          {state.status === 'results' &&
            state.results.map((person) => (
              // A plain View on purpose: tapping a row does nothing until Project 7.
              <View key={person.uid} testID="search-result-row" style={styles.row}>
                <InitialsAvatar name={person.name} size={AVATAR_SIZE} />
                <Text style={styles.rowName} numberOfLines={1}>{person.name}</Text>
              </View>
            ))}
        </ScrollView>
      )}
    </View>
  );
};

const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.base, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerTitle: { ...typography.display, color: colors.primary, fontFamily: 'Inter' },
  searchBar: {
    ...typography.body,
    fontFamily: 'Inter',
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md },
  rowName: { ...typography.body, flex: 1, color: colors.textPrimary, fontFamily: 'Inter' },
});

export default SearchTab;

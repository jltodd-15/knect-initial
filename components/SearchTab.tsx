import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import InitialsAvatar from './InitialsAvatar';
import EmptyState from './shared/EmptyState';
import ErrorState from './shared/ErrorState';
import SkeletonCard from './shared/SkeletonCard';
import { UserSearchService } from '../services/UserSearchService';
import { UserSearchResult, createLatestTracker, createSearchScheduler, isSearchable } from '../services/userSearch';

// Ticket 4.3: look people up by the start of their name. The rules for when a search runs and
// which answer counts are in services/userSearch.ts; this screen shows the state they produce.

const PLACEHOLDER = 'Search for friends...';
const SKELETON_ROWS = 3;
// The skeleton row's avatar size, so a row doesn't shift when it replaces its skeleton.
const AVATAR_SIZE = 48;

type SearchState =
  // Fewer than 3 characters: no results area at all. Not an empty state.
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'results'; results: UserSearchResult[] };

const SearchTab: React.FC = () => {
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

  const handleChangeText = (next: string) => {
    setText(next);
    // The text has changed, so an answer still on its way is for something no longer typed.
    tracker.invalidate();
    if (isSearchable(next)) setState({ status: 'loading' });
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

      {state.status === 'idle' ? null : (
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

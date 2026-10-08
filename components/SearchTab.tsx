import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';

// Ticket 4.1: a placeholder — the banner only. Ticket 4.3 fills it.
const SearchTab: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>
    </View>
  );
};

const getStyles = ({ colors, typography, spacing }: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.base, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerTitle: { ...typography.display, color: colors.primary, fontFamily: 'Inter' },
});

export default SearchTab;

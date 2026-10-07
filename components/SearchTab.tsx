import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  isDarkMode: boolean;
}

// Ticket 4.1: a placeholder — the banner only. Ticket 4.3 fills it.
const SearchTab: React.FC<Props> = ({ isDarkMode }) => {
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#000' : '#fff' },
  header: { padding: 16, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#10b981', fontFamily: 'Inter' },
});

export default SearchTab;

import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Switch } from 'react-native';

interface Props {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<Props> = ({ isDarkMode, toggleDarkMode, onLogout }) => {
  const styles = getStyles(isDarkMode);
  const interests = ['Hiking', 'Techno', 'Brunch', 'Minimalism', 'Coffee'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: 'https://picsum.photos/seed/knect-me/300' }} style={styles.avatar} />
        <Text style={styles.name}>Alex Rivera</Text>
        <Text style={styles.location}>DIGITAL NOMAD • SAN FRANCISCO</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.tagsContainer}>
            {interests.map(i => (
                <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{i}</Text>
                </View>
            ))}
        </View>
      </View>

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch 
                value={isDarkMode} 
                onValueChange={toggleDarkMode} 
                trackColor={{ false: '#767577', true: '#10b981' }}
              />
          </View>
      </View>

      <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  profileHeader: { alignItems: 'center', marginVertical: 40 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: isDark ? '#1E1E1E' : 'white', marginBottom: 20 },
  name: { fontSize: 32, fontWeight: '900', color: '#10b981' },
  location: { fontSize: 10, fontWeight: '900', color: '#71717a', letterSpacing: 2, marginTop: 8 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#71717a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: isDark ? '#1E1E1E' : 'white', borderWidth: 1, borderColor: isDark ? '#27272a' : '#f4f4f5' },
  tagText: { fontSize: 11, fontWeight: 'bold', color: isDark ? '#ccc' : '#555', textTransform: 'uppercase', letterSpacing: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: isDark ? '#1E1E1E' : 'white', borderRadius: 24, marginBottom: 8 },
  settingLabel: { fontSize: 14, fontWeight: 'bold', color: isDark ? 'white' : '#333' },
  logoutButton: { marginTop: 20, padding: 20, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 2 }
});

export default ProfilePage;
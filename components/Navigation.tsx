import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isDarkMode: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, isDarkMode }) => {
  const styles = getStyles(isDarkMode);

  const tabs = [
    { id: AppTab.PLANNER, label: 'Planner', icon: '📅' },
    { id: AppTab.FEED, label: 'Discover', icon: '🔍' },
    { id: AppTab.SOCIAL, label: 'Circle', icon: '💬' },
    { id: AppTab.PROFILE, label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: isDark ? '#27272a' : '#f4f4f5',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Safe area padding
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    marginBottom: 4,
    transform: [{ scale: 1 }],
  },
  activeIconContainer: {
    transform: [{ scale: 1.1 }],
  },
  icon: {
    fontSize: 20,
    opacity: 0.5,
    filter: isDark ? 'grayscale(100%)' : 'none', // Web support
  },
  activeIcon: {
    opacity: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: isDark ? '#71717a' : '#a1a1aa',
  },
  activeLabel: {
    color: '#10b981',
  }
});

export default Navigation;
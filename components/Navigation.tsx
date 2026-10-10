import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Calendar, Compass, Search, User, Users, LucideIcon } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';

// Ticket 4.1: the tab navigator's bar. The tabs, their order and their labels come from the
// navigator's own routes (App.tsx); this file only draws them.
type NavigationProps = BottomTabBarProps;

// A.6: the tab bar's five Lucide icons.
const TAB_ICONS: Record<string, LucideIcon> = {
  Planner: Calendar,
  Discover: Compass,
  Search,
  Circle: Users,
  Profile: User,
};

const Navigation: React.FC<NavigationProps> = ({ state, navigation }) => {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const color = isActive ? colors.primary : colors.textDisabled;
          const TabIcon = TAB_ICONS[route.name];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={route.name}
              accessibilityState={{ selected: isActive }}
            >
              <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                {TabIcon && (
                  <TabIcon
                    testID={`tab-icon-${route.name}`}
                    size={theme.icons.sizes.tab}
                    color={color}
                    strokeWidth={theme.icons.strokeWidth}
                  />
                )}
              </View>
              <Text style={[styles.label, { color }]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const getStyles = ({ colors, typography, spacing }: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : 0,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    marginBottom: spacing.xs,
    transform: [{ scale: 1 }],
  },
  activeIconContainer: {
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: typography.micro.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});

export default Navigation;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';

// Ticket 1.4: the picture every user has, whether or not they ever upload one. Drawn on the
// device from the name; nothing is generated, uploaded or stored, so profile_picture_url stays ""
// for a user who never uploads. With no usable name it draws a plain person glyph instead, which
// is also the "Deleted user" placeholder for a person that resolves to nothing.

// First letter of the first and last words. Array.from keeps an emoji or other multi-unit
// character whole instead of splitting it in half.
export const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : '';
  return (first + last).toUpperCase();
};

interface Props {
  name: string;
  size: number;
}

const InitialsAvatar: React.FC<Props> = ({ name, size }) => {
  const { colors, icons } = useTheme();
  const initials = getInitials(name);
  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.circle, circle, { backgroundColor: colors.primary }]} testID="initials-avatar">
      {initials ? (
        <Text style={[styles.initials, { fontSize: size * 0.38, color: colors.onPrimary }]} numberOfLines={1}>
          {initials}
        </Text>
      ) : (
        <User testID="initials-avatar-fallback" size={size * 0.5} color={colors.onPrimary} strokeWidth={icons.strokeWidth} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  initials: { fontWeight: '700', fontFamily: 'Manrope' },
});

export default InitialsAvatar;

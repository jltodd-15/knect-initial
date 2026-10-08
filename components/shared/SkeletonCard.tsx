import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

// Ticket 4.2 (Appendix B): the grayed-out placeholder shown while content loads. The only loading
// visual for content in the app; never a spinner.

interface Props {
  variant: 'activity' | 'list-row';
}

const SkeletonCard: React.FC<Props> = ({ variant }) => {
  const { colors, spacing, radius } = useTheme();
  const block = { backgroundColor: colors.surfaceAlt };
  const line = (width: `${number}%`, height: number) => (
    <View testID="skeleton-line" style={[block, { width, height, borderRadius: radius.sm }]} />
  );

  if (variant === 'list-row') {
    return (
      <View testID="skeleton-list-row" style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md }}>
        <View testID="skeleton-avatar" style={[block, { width: 48, height: 48, borderRadius: radius.pill }]} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          {line('50%', 16)}
          {line('75%', 12)}
        </View>
      </View>
    );
  }

  return (
    <View
      testID="skeleton-activity"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.xl,
        padding: spacing.base,
        gap: spacing.md,
      }}
    >
      <View testID="skeleton-image" style={[block, { height: 200, borderRadius: radius.lg }]} />
      {line('60%', 20)}
      {line('85%', 12)}
    </View>
  );
};

export default SkeletonCard;

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';

// Ticket 4.2 (Appendix B): nothing is broken, there is just nothing here. A message and, usually,
// a suggested action. No error icon; a failure is ErrorState's.

interface Props {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<Props> = ({ message, actionLabel, onAction }) => {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View testID="empty-state" style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.base }}>
      <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          testID="empty-state-action"
          onPress={onAction}
          style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl }}
        >
          <Text style={[typography.label, { color: colors.onPrimary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default EmptyState;

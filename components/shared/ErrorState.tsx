import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';

// Ticket 4.2 (Appendix B): something went wrong - a lost connection, a failed query, a missing
// document. The circle-and-! in danger, a message, and a retry where retrying makes sense.

export const DEFAULT_ERROR_MESSAGE = "Sorry, we couldn't load anything right now.";

interface Props {
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<Props> = ({ message = DEFAULT_ERROR_MESSAGE, onRetry }) => {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View testID="error-state" style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.base }}>
      <View
        testID="error-state-icon"
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.pill,
          borderWidth: 3,
          borderColor: colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={[typography.title, { color: colors.danger }]}>!</Text>
      </View>
      <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity
          testID="error-state-retry"
          onPress={onRetry}
          style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl }}
        >
          <Text style={[typography.label, { color: colors.onPrimary }]}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default ErrorState;

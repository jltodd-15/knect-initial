import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext, Theme } from '../theme/ThemeProvider';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// A class can't call useTheme(), so it reads the same context directly. It is mounted above
// ThemeProvider (index.js), so what it gets is the light theme.
class ErrorBoundary extends Component<Props, State> {
  static contextType = ThemeContext;
  props: Props;
  state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const styles = getStyles(this.context as Theme);
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong.</Text>
          <Text style={styles.error}>{this.state.error?.message}</Text>
        </View>
      );
    }

    return (this.props as any).children;
  }
}

const getStyles = ({ colors, typography, spacing }: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.dangerSurface
  },
  title: {
    ...typography.headline,
    color: colors.danger,
    marginBottom: spacing.md
  },
  error: {
    fontSize: typography.label.fontSize,
    color: colors.danger,
    textAlign: 'center'
  }
});

export default ErrorBoundary;

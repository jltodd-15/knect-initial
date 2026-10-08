/**
 * Ticket 4.2: the three shared states every screen uses (Appendix B). A skeleton while content
 * loads, an empty state when nothing is wrong but there is nothing to show, and an error state
 * when something failed.
 */

import React from 'react';
import {StyleSheet} from 'react-native';
import {render, screen, fireEvent} from '@testing-library/react-native';
import SkeletonCard from '../components/shared/SkeletonCard';
import EmptyState from '../components/shared/EmptyState';
import ErrorState, {DEFAULT_ERROR_MESSAGE} from '../components/shared/ErrorState';
import {ThemeProvider} from '../theme/ThemeProvider';
import {colors} from '../theme/tokens';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}));

const useColorScheme: jest.Mock = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default;
const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

beforeEach(() => useColorScheme.mockReturnValue('light'));

describe('SkeletonCard', () => {
  test('the activity variant is an image block and two text lines', async () => {
    await render(<SkeletonCard variant="activity" />);
    expect(screen.getByTestId('skeleton-activity')).toBeTruthy();
    expect(screen.getByTestId('skeleton-image')).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-line')).toHaveLength(2);
    expect(screen.queryByTestId('skeleton-avatar')).toBeNull();
  });

  test('the list-row variant is an avatar circle and two text lines', async () => {
    await render(<SkeletonCard variant="list-row" />);
    expect(screen.getByTestId('skeleton-list-row')).toBeTruthy();
    expect(screen.getByTestId('skeleton-avatar')).toBeTruthy();
    expect(screen.getAllByTestId('skeleton-line')).toHaveLength(2);
    expect(screen.queryByTestId('skeleton-image')).toBeNull();
  });

  test('the placeholder blocks are surface-alt, in light and in dark', async () => {
    const first = await render(<SkeletonCard variant="list-row" />);
    expect(styleOf('skeleton-avatar').backgroundColor).toBe(colors.surfaceAlt.light);
    await first.unmount();

    useColorScheme.mockReturnValue('dark');
    await render(
      <ThemeProvider>
        <SkeletonCard variant="list-row" />
      </ThemeProvider>,
    );
    await screen.findByTestId('skeleton-avatar');
    expect(styleOf('skeleton-avatar').backgroundColor).toBe(colors.surfaceAlt.dark);
  });

  test('it is never a spinner', async () => {
    await render(<SkeletonCard variant="activity" />);
    expect(JSON.stringify(screen.toJSON())).not.toContain('ActivityIndicator');
  });
});

describe('EmptyState', () => {
  test('shows its message and no button when given no action', async () => {
    await render(<EmptyState message="No conversations yet." />);
    expect(screen.getByText('No conversations yet.')).toBeTruthy();
    expect(screen.queryByTestId('empty-state-action')).toBeNull();
  });

  test('shows an action button that calls back when tapped', async () => {
    const onAction = jest.fn();
    await render(<EmptyState message="No conversations yet." actionLabel="Find a friend" onAction={onAction} />);
    fireEvent.press(screen.getByText('Find a friend'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test('has no error icon', async () => {
    await render(<EmptyState message="No conversations yet." />);
    expect(screen.queryByTestId('error-state-icon')).toBeNull();
  });
});

describe('ErrorState', () => {
  test('shows the default copy when given no message', async () => {
    await render(<ErrorState />);
    expect(DEFAULT_ERROR_MESSAGE).toBe("Sorry, we couldn't load anything right now.");
    expect(screen.getByText(DEFAULT_ERROR_MESSAGE)).toBeTruthy();
  });

  test('shows its own message when given one', async () => {
    await render(<ErrorState message="This activity is gone." />);
    expect(screen.getByText('This activity is gone.')).toBeTruthy();
    expect(screen.queryByText(DEFAULT_ERROR_MESSAGE)).toBeNull();
  });

  test('draws the circle-and-! in danger', async () => {
    await render(<ErrorState />);
    expect(styleOf('error-state-icon').borderColor).toBe(colors.danger.light);
    expect(screen.getByText('!')).toBeTruthy();
  });

  test('calls retry when the retry button is tapped', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState onRetry={onRetry} />);
    fireEvent.press(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('has no retry button when retrying makes no sense', async () => {
    await render(<ErrorState />);
    expect(screen.queryByTestId('error-state-retry')).toBeNull();
  });
});

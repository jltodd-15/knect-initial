/**
 * Ticket 4.2: while Discover loads it shows skeleton activity cards, never a spinner.
 */

import React from 'react';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import DiscoveryFeed from '../components/DiscoveryFeed';

test('loading shows skeleton cards, then the feed', async () => {
  let view!: ReactTestRenderer;
  // A synchronous act runs the first render and its effects but not the awaited load, so this is
  // the screen as it looks while loading.
  act(() => {
    view = create(<DiscoveryFeed />);
  });
  const loading = JSON.stringify(view.toJSON());
  expect(view.root.findAllByProps({testID: 'skeleton-activity'}).length).toBeGreaterThan(0);
  expect(loading).not.toContain('ActivityIndicator');
  expect(loading).not.toContain('VIEW SPOT');

  await act(async () => {});
  const loaded = JSON.stringify(view.toJSON());
  expect(view.root.findAllByProps({testID: 'skeleton-activity'})).toHaveLength(0);
  expect(loaded).toContain('VIEW SPOT');
});

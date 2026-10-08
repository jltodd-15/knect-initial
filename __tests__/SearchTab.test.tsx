/**
 * Ticket 4.1: the Search tab is a placeholder — the "Search" banner and nothing else. 4.3 fills it.
 */

import React from 'react';
import {render, screen} from '@testing-library/react-native';
import SearchTab from '../components/SearchTab';

test('shows the Search banner', async () => {
  await render(<SearchTab isDarkMode={false} />);

  expect(screen.getByText('Search')).toBeTruthy();
});

test('shows nothing but the banner', async () => {
  await render(<SearchTab isDarkMode={false} />);

  // Every string anywhere in what was rendered.
  const collectText = (node: unknown): string[] => {
    if (typeof node === 'string') return [node];
    if (Array.isArray(node)) return node.flatMap(collectText);
    if (node && typeof node === 'object') return collectText((node as {children?: unknown}).children ?? []);
    return [];
  };
  expect(collectText(screen.toJSON())).toEqual(['Search']);
});

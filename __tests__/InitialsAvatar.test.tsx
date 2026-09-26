/**
 * Ticket 1.4: the picture every user has, uploaded or not. Drawn on the device from a name; no
 * image is generated or stored. With no usable name it falls back to a plain person glyph, which is
 * also the "Deleted user" placeholder for a person that resolves to nothing.
 */

import React from 'react';
import {render, screen} from '@testing-library/react-native';
import InitialsAvatar, {getInitials} from '../components/InitialsAvatar';

test('two words give first and last initials', () => {
  expect(getInitials('Alex Rivera')).toBe('AR');
});

test('three or more words use the first and last word only', () => {
  expect(getInitials('Mary Jane Watson')).toBe('MW');
});

test('one word gives one initial', () => {
  expect(getInitials('alex')).toBe('A');
});

test('extra whitespace is ignored', () => {
  expect(getInitials('   alex    rivera  ')).toBe('AR');
});

test('an empty or blank name has no initials', () => {
  expect(getInitials('')).toBe('');
  expect(getInitials('   ')).toBe('');
});

test('a name starting with an emoji keeps the whole character, not half of it', () => {
  expect(getInitials('😀 Rivera')).toBe('😀R');
});

test('renders the initials for a name', async () => {
  await render(<InitialsAvatar name="Alex Rivera" size={120} />);
  expect(screen.getByText('AR')).toBeTruthy();
  expect(screen.queryByTestId('initials-avatar-fallback')).toBeNull();
});

test('renders the fallback glyph, not an empty circle, when there is no name', async () => {
  await render(<InitialsAvatar name="" size={120} />);
  expect(screen.getByTestId('initials-avatar-fallback')).toBeTruthy();
});

test('re-renders when the name changes', async () => {
  const {rerender} = await render(<InitialsAvatar name="Alex" size={120} />);
  expect(screen.getByText('A')).toBeTruthy();
  await rerender(<InitialsAvatar name="Alex Rivera" size={120} />);
  expect(screen.getByText('AR')).toBeTruthy();
});

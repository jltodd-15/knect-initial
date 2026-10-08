/**
 * Ticket 4.2: the design tokens of Appendix A, defined once. Every color has a light and a dark
 * value; the event colors are their own palette and are the same in both modes.
 */

import {colors, eventColors, typography, spacing, radius, resolveColors} from '../theme/tokens';

const HEX = /^#[0-9a-fA-F]{6}$/;

const APPENDIX_A2 = [
  'primary',
  'primaryPressed',
  'primarySurface',
  'onPrimary',
  'danger',
  'dangerSurface',
  'background',
  'surface',
  'surfaceAlt',
  'border',
  'textPrimary',
  'textSecondary',
  'textDisabled',
  'placeholder',
];

test('the color tokens are exactly the ones in Appendix A.2', () => {
  expect(Object.keys(colors).sort()).toEqual([...APPENDIX_A2].sort());
});

test.each(APPENDIX_A2)('%s has both a light and a dark value', name => {
  const token = colors[name as keyof typeof colors];
  expect(token.light).toMatch(HEX);
  expect(token.dark).toMatch(HEX);
});

test('primary is emerald-500 in both modes', () => {
  expect(colors.primary).toEqual({light: '#10b981', dark: '#10b981'});
});

test('resolveColors picks one value per token for a mode', () => {
  expect(resolveColors('light').background).toBe('#FDFCFB');
  expect(resolveColors('dark').background).toBe('#121212');
  expect(Object.keys(resolveColors('dark')).sort()).toEqual([...APPENDIX_A2].sort());
});

test('the event colors are the six a user can pick, unchanged', () => {
  expect(eventColors).toEqual(['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308']);
});

test('the type scale matches Appendix A.3', () => {
  expect(typography).toEqual({
    display: {fontSize: 32, fontWeight: '900'},
    title: {fontSize: 24, fontWeight: '700'},
    headline: {fontSize: 20, fontWeight: '700'},
    body: {fontSize: 16, fontWeight: '400'},
    label: {fontSize: 14, fontWeight: '600'},
    caption: {fontSize: 12, fontWeight: '400'},
    micro: {fontSize: 10, fontWeight: '600'},
  });
});

test('900 is used for display only', () => {
  const heavy = Object.entries(typography)
    .filter(([, style]) => style.fontWeight === '900')
    .map(([name]) => name);
  expect(heavy).toEqual(['display']);
});

test('spacing and radius match Appendix A.4 and A.5', () => {
  expect(spacing).toEqual({xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32});
  expect(radius).toEqual({sm: 8, md: 12, lg: 16, xl: 24, pill: 999});
});

/**
 * Tickets 4.2 and 4.5: the design tokens of Appendix A, defined once.
 *
 * docs/design/tokens.json is the machine-readable copy of Appendix A (2026-10-09). These tests
 * compare theme/tokens.ts against it value by value, so the two cannot drift apart.
 */

import design from '../docs/design/tokens.json';
import {
  colors,
  eventColors,
  eventColorFor,
  typography,
  spacing,
  radius,
  sizes,
  icons,
  FONT_FAMILY,
  resolveColors,
} from '../theme/tokens';

// Six digits, or eight when the last two are an opacity.
const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

// Appendix A names tokens in kebab-case (surface-alt); the code uses camelCase (surfaceAlt).
const camel = (name: string) => name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

// Not in Appendix A's table or tokens.json. shadow, scrim and onPrimaryMuted were approved during
// 4.2. onDanger was ruled on 2026-10-09 (white text on a danger fill). onColor is 4.5's: white on a
// photo, an event color or a dark toast, which is what onPrimary used to mean.
const CODE_ONLY = {
  shadow: {light: '#000000', dark: '#000000'},
  scrim: {light: '#00000080', dark: '#00000080'},
  onPrimaryMuted: {light: '#FFFFFF33', dark: '#FFFFFF33'},
  onDanger: {light: '#ffffff', dark: '#ffffff'},
  onColor: {light: '#ffffff', dark: '#ffffff'},
};

const designColorNames = Object.keys(design.color.light);

test('the color tokens are exactly the design tokens plus the code-only extras', () => {
  const expected = [...designColorNames.map(camel), ...Object.keys(CODE_ONLY)];
  expect(Object.keys(colors).sort()).toEqual(expected.sort());
});

test.each(designColorNames)('%s has the design value in light and in dark', name => {
  const token = colors[camel(name) as keyof typeof colors];
  expect(token.light.toLowerCase()).toBe((design.color.light as Record<string, string>)[name].toLowerCase());
  expect(token.dark.toLowerCase()).toBe((design.color.dark as Record<string, string>)[name].toLowerCase());
});

test.each(Object.keys(colors))('%s is a hex value in both modes', name => {
  const token = colors[name as keyof typeof colors];
  expect(token.light).toMatch(HEX);
  expect(token.dark).toMatch(HEX);
});

test('the code-only extras have the agreed values', () => {
  Object.entries(CODE_ONLY).forEach(([name, value]) => {
    expect(colors[name as keyof typeof colors]).toEqual(value);
  });
});

test('primary is emerald-500 in both modes, and text on it is dark, not white', () => {
  expect(colors.primary).toEqual({light: '#10b981', dark: '#10b981'});
  expect(colors.onPrimary).toEqual({light: '#052e22', dark: '#052e22'});
});

test('resolveColors picks one value per token for a mode', () => {
  expect(resolveColors('light').background).toBe('#FDFCFB');
  expect(resolveColors('dark').background).toBe('#121212');
  expect(Object.keys(resolveColors('dark')).sort()).toEqual(Object.keys(colors).sort());
});

test('the event colors are the six of A.2.1, in the order a user picks them', () => {
  expect(eventColors.map(color => color.name)).toEqual(['emerald', 'blue', 'violet', 'pink', 'orange', 'yellow']);
  eventColors.forEach(color => {
    const fromDesign = (design.eventColors as Record<string, Record<string, string>>)[color.name];
    expect(color.base).toBe(fromDesign.base);
    expect(color.solid).toBe(fromDesign.solid);
    expect(color.textOnBase).toBe(fromDesign.textOnBase);
    expect(color.textOnSolid).toBe(fromDesign.textOnSolid);
    expect(color.proposedFill).toBe(fromDesign.proposedFill);
  });
});

test('the base values a user could already have stored on an event are unchanged', () => {
  expect(eventColors.map(color => color.base)).toEqual([
    '#10b981',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#f97316',
    '#eab308',
  ]);
});

test('an event color is found by the base value stored on the event, in any letter case', () => {
  expect(eventColorFor('#3b82f6')?.name).toBe('blue');
  expect(eventColorFor('#3B82F6')?.solid).toBe('#1d4ed8');
  expect(eventColorFor('#123456')).toBeUndefined();
});

test('the type scale matches Appendix A.3, every style in Manrope', () => {
  const expected: Record<string, unknown> = {};
  Object.entries(design.type).forEach(([name, style]) => {
    expected[camel(name)] = {
      fontFamily: 'Manrope',
      fontSize: style.size,
      fontWeight: String(style.weight),
      letterSpacing: style.letterSpacing,
    };
  });
  expect(typography).toEqual(expected);
  expect(FONT_FAMILY).toBe(design.font.family);
});

test('no style is heavier than 800: Manrope has no 900', () => {
  Object.values(typography).forEach(style => {
    expect(Number(style.fontWeight)).toBeLessThanOrEqual(800);
  });
});

test('spacing, radius and the fixed sizes match the design tokens', () => {
  expect(spacing).toEqual(design.space);
  expect(radius).toEqual(design.radius);
  const expectedSizes: Record<string, number> = {};
  Object.entries(design.size).forEach(([name, value]) => {
    expectedSizes[camel(name)] = value;
  });
  expect(sizes).toEqual(expectedSizes);
});

test('icons are drawn at stroke 2.4, in the three design sizes', () => {
  expect(icons.strokeWidth).toBe(design.icons.strokeWidth);
  expect(icons.sizes).toEqual(design.icons.sizes);
});

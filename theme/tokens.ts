// Tickets 4.2 and 4.5: the design tokens of Appendix A, defined once. Components read them through
// useTheme(); a hex value anywhere outside this folder is a bug. docs/design/tokens.json is the
// same set of values; __tests__/theme.tokens.test.ts fails if the two drift apart.

export type ThemeMode = 'light' | 'dark';

// A.2. Appendix A names these in kebab-case (surface-alt); here they are camelCase (surfaceAlt).
// The last two digits of an eight-digit value are its opacity.
export const colors = {
  primary: { light: '#10b981', dark: '#10b981' }, // emerald-500
  primaryPressed: { light: '#059669', dark: '#059669' }, // emerald-600, pressed state only
  primarySurface: { light: '#ecfdf5', dark: '#064e3b' },
  // Text and icons on a primary fill, and nothing else. Dark, not white: white on emerald fails contrast.
  onPrimary: { light: '#052e22', dark: '#052e22' },
  danger: { light: '#ef4444', dark: '#ef4444' },
  dangerText: { light: '#dc2626', dark: '#f87171' },
  dangerSurface: { light: '#fee2e2', dark: '#450a0a' },
  dangerBorder: { light: '#fca5a5', dark: '#7f1d1d' },
  warning: { light: '#eab308', dark: '#eab308' },
  warningText: { light: '#854d0e', dark: '#fde68a' },
  warningSurface: { light: '#fef9c3', dark: '#2b2410' },
  warningBorder: { light: '#fde047', dark: '#a16207' },
  background: { light: '#FDFCFB', dark: '#121212' },
  surface: { light: '#FFFFFF', dark: '#1E1E1E' },
  surfaceAlt: { light: '#f4f4f5', dark: '#27272a' },
  backdrop: { light: '#00000059', dark: '#000000' }, // behind a sheet; black at 35% in light
  tabBar: { light: '#FFFFFF', dark: '#1a1a1a' },
  border: { light: '#e4e4e7', dark: '#3f3f46' },
  divider: { light: '#e4e4e7', dark: '#27272a' },
  textStrong: { light: '#18181b', dark: '#ffffff' },
  textPrimary: { light: '#27272a', dark: '#f4f4f5' },
  textSecondary: { light: '#71717a', dark: '#a1a1aa' },
  textDisabled: { light: '#a1a1aa', dark: '#52525b' },
  placeholder: { light: '#a1a1aa', dark: '#71717a' },
  busyStripeA: { light: '#e4e4e7', dark: '#2a2a2e' },
  busyStripeB: { light: '#f4f4f5', dark: '#1f1f22' },
  busyInitials: { light: '#a1a1aa', dark: '#52525b' },
  // Not in Appendix A's table. The first three were added during 4.2's mapping approval.
  shadow: { light: '#000000', dark: '#000000' },
  scrim: { light: '#00000080', dark: '#00000080' }, // the dim behind a modal, black at 50%
  onPrimaryMuted: { light: '#FFFFFF33', dark: '#FFFFFF33' }, // dividers on a colored block, white at 20%
  // Text on a danger fill (ruled 2026-10-09).
  onDanger: { light: '#ffffff', dark: '#ffffff' },
  // White on a photo, an event color, a dark toast or a switch thumb: any filled block that is
  // neither primary nor danger. This is what onPrimary meant before 4.5.
  onColor: { light: '#ffffff', dark: '#ffffff' },
} as const;

export type ColorToken = keyof typeof colors;
export type ThemeColors = Record<ColorToken, string>;

export const resolveColors = (mode: ThemeMode): ThemeColors => {
  const resolved = {} as ThemeColors;
  (Object.keys(colors) as ColorToken[]).forEach((name) => {
    resolved[name] = colors[name][mode];
  });
  return resolved;
};

// A.2.1. The colors a user can pick for an event, in the order the picker shows them. The base
// value is what is stored on the event, so these are not theme tokens: they are the same in light
// and dark, and a base value must never change.
export interface EventColor {
  name: string;
  base: string; // stored on the event; swatches and the proposed outline
  solid: string; // the 700 shade: confirmed and personal event fills
  textOnBase: string;
  textOnSolid: string;
  proposedFill: string; // base at 8%
}

const eventColor = (name: string, base: string, solid: string): EventColor => ({
  name,
  base,
  solid,
  textOnBase: '#0d0d12',
  textOnSolid: '#ffffff',
  proposedFill: `${base}14`,
});

export const eventColors: readonly EventColor[] = [
  eventColor('emerald', '#10b981', '#047857'),
  eventColor('blue', '#3b82f6', '#1d4ed8'),
  eventColor('violet', '#8b5cf6', '#6d28d9'),
  eventColor('pink', '#ec4899', '#be185d'),
  eventColor('orange', '#f97316', '#c2410c'),
  eventColor('yellow', '#eab308', '#a16207'),
];

// The palette entry for the base value stored on an event.
export const eventColorFor = (base: string): EventColor | undefined =>
  eventColors.find((color) => color.base === base.toLowerCase());

// A.3. One family; the weight picks the file. Manrope has no 900, so 800 is the heaviest.
export const FONT_FAMILY = 'Manrope';

const type = <W extends string>(fontSize: number, fontWeight: W, letterSpacing = 0) =>
  ({ fontFamily: FONT_FAMILY, fontSize, fontWeight, letterSpacing }) as const;

export const typography = {
  display: type(32, '800', -0.8),
  title: type(24, '800', -0.4),
  headline: type(20, '800', -0.3),
  navTitle: type(17, '800'),
  button: type(16, '800'),
  body: type(16, '400'),
  bodySm: type(15, '500'),
  label: type(14, '700'),
  caption: type(13, '500'),
  footnote: type(12, '500'),
  micro: type(11, '800'),
  avatar: type(10, '800'),
} as const;

// A.4
export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32 } as const;

// A.5
export const radius = { sm: 8, event: 10, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const sizes = {
  hourHeight: 48,
  buttonHeight: 52,
  rowHeight: 52,
  touchMin: 44,
  tabBarHeight: 84,
  avatarSm: 26,
  avatarMd: 32,
  snapMinutes: 15,
} as const;

// A.6. Lucide, through lucide-react-native.
export const icons = {
  strokeWidth: 2.4,
  sizes: { tab: 24, nav: 24, inline: 18, small: 16 },
} as const;

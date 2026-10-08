// Ticket 4.2: the design tokens of Appendix A, defined once. Components read them through
// useTheme(); a hex value anywhere outside this folder is a bug.

export type ThemeMode = 'light' | 'dark';

// A.2. Appendix A names these in kebab-case (surface-alt); here they are camelCase (surfaceAlt).
export const colors = {
  primary: { light: '#10b981', dark: '#10b981' }, // emerald-500
  primaryPressed: { light: '#059669', dark: '#059669' }, // emerald-600, pressed state only
  primarySurface: { light: '#ecfdf5', dark: '#064e3b' },
  onPrimary: { light: '#FFFFFF', dark: '#FFFFFF' },
  danger: { light: '#ef4444', dark: '#ef4444' },
  dangerSurface: { light: '#fee2e2', dark: '#450a0a' },
  background: { light: '#FDFCFB', dark: '#121212' },
  surface: { light: '#FFFFFF', dark: '#1E1E1E' },
  surfaceAlt: { light: '#f4f4f5', dark: '#27272a' },
  border: { light: '#e4e4e7', dark: '#3f3f46' },
  textPrimary: { light: '#27272a', dark: '#f4f4f5' },
  textSecondary: { light: '#71717a', dark: '#a1a1aa' },
  textDisabled: { light: '#a1a1aa', dark: '#52525b' },
  placeholder: { light: '#a1a1aa', dark: '#52525b' },
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

// The colors a user can pick for an event. The picked value is stored on the event, so these are
// not theme tokens: they are the same in light and dark and must not change.
export const eventColors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'] as const;

// A.3. 900 is for display only.
export const typography = {
  display: { fontSize: 32, fontWeight: '900' },
  title: { fontSize: 24, fontWeight: '700' },
  headline: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '400' },
  micro: { fontSize: 10, fontWeight: '600' },
} as const;

// A.4
export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32 } as const;

// A.5
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

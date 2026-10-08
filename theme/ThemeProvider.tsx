import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { userStore } from '../utils/storage';
import { resolveColors, typography, spacing, radius, ThemeColors, ThemeMode } from './tokens';

// Ticket 4.2: the theme follows the phone's light/dark setting unless the user has picked Light or
// Dark. The pick is saved on the device and read back on launch.

export type ThemeOverride = 'system' | ThemeMode;

export interface Theme {
  mode: ThemeMode;
  override: ThemeOverride;
  setOverride: (next: ThemeOverride) => Promise<void>;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
}

const OVERRIDE_KEY = 'theme_override';

const buildTheme = (mode: ThemeMode, override: ThemeOverride, setOverride: Theme['setOverride']): Theme => ({
  mode,
  override,
  setOverride,
  colors: resolveColors(mode),
  typography,
  spacing,
  radius,
});

// What useTheme() returns with no provider above it: the light theme, with a pick that does nothing.
export const ThemeContext = createContext<Theme>(buildTheme('light', 'system', async () => {}));

const isOverride = (value: unknown): value is ThemeOverride =>
  value === 'system' || value === 'light' || value === 'dark';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const phone = useColorScheme();
  const [override, setOverrideState] = useState<ThemeOverride>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await userStore.getItem(OVERRIDE_KEY);
        if (!cancelled && isOverride(saved)) setOverrideState(saved);
      } catch {
        // An unreadable pick is treated as no pick: follow the phone.
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setOverride = useCallback(async (next: ThemeOverride) => {
    setOverrideState(next);
    try {
      await userStore.setItem(OVERRIDE_KEY, next);
    } catch {
      // The pick still applies until the app closes; it just won't be there next launch.
    }
  }, []);

  const mode: ThemeMode = override === 'system' ? (phone === 'dark' ? 'dark' : 'light') : override;
  const theme = useMemo(() => buildTheme(mode, override, setOverride), [mode, override, setOverride]);

  // Draw nothing until the saved pick has been read, so the wrong theme never flashes on launch.
  if (!loaded) return null;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

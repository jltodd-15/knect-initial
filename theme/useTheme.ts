import { useContext } from 'react';
import { ThemeContext, Theme } from './ThemeProvider';

// Ticket 4.2: the one way a component reads colors, type, spacing and radius.
export const useTheme = (): Theme => useContext(ThemeContext);

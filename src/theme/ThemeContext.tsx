import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from './colors';
import { borderWidth, elevation, radius, sizes, spacing } from './layout';
import {
  fonts,
  fontSize,
  letterSpacing,
  lineHeight,
  textStyles,
} from './typography';

/**
 * Theme provider.
 *
 * Mirrors the website's `next-themes` setup (`webSrc/src/components/theme-provider.tsx`)
 * but adds a `system` mode, which is the expected default on a phone. The web
 * pins `defaultTheme="light"` with `enableSystem={false}`; on mobile, following
 * the OS setting is the platform convention, so `system` is the default here.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = '@tsb/theme-mode';

export type Theme = {
  colors: ThemeColors;
  fonts: typeof fonts;
  fontSize: typeof fontSize;
  letterSpacing: typeof letterSpacing;
  lineHeight: typeof lineHeight;
  textStyles: typeof textStyles;
  radius: typeof radius;
  spacing: typeof spacing;
  sizes: typeof sizes;
  borderWidth: typeof borderWidth;
  /** `elevation(level)` — colours are already bound to the active theme. */
  elevation: (level?: 'none' | 'sm' | 'md' | 'lg') => ReturnType<
    typeof elevation
  >;
  isDark: boolean;
};

type ThemeContextValue = Theme & {
  /** What the user picked — may be 'system'. */
  mode: ThemeMode;
  /** What that resolves to right now. */
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** Flips between light and dark, leaving 'system' behind. */
  toggleTheme: () => void;
  /** False until the stored preference has been read back. */
  isThemeLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isThemeLoaded, setThemeLoaded] = useState(false);

  // Restore the saved preference on cold start.
  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (cancelled) {
          return;
        }
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      })
      .catch(() => {
        // A failed read just means we fall back to 'system' — not worth
        // surfacing to the user.
      })
      .finally(() => {
        if (!cancelled) {
          setThemeLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Preference is still applied for this session even if the write fails.
    });
  }, []);

  const resolvedTheme: ResolvedTheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const toggleTheme = useCallback(() => {
    setMode(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setMode]);

  const value = useMemo<ThemeContextValue>(() => {
    const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

    return {
      colors,
      fonts,
      fontSize,
      letterSpacing,
      lineHeight,
      textStyles,
      radius,
      spacing,
      sizes,
      borderWidth,
      elevation: (level = 'sm') => elevation(colors, level),
      isDark: resolvedTheme === 'dark',
      mode,
      resolvedTheme,
      setMode,
      toggleTheme,
      isThemeLoaded,
    };
  }, [resolvedTheme, mode, setMode, toggleTheme, isThemeLoaded]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

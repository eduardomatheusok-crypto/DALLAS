import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../storage';
import { darkColors, lightColors, type ThemePalette } from './palette';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  isDark: boolean;
  colors: ThemePalette;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    storage.getThemeMode().then((m) => {
      if (m === 'light' || m === 'dark' || m === 'system') setModeState(m);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storage.setThemeMode(next);
  }, []);

  const resolved: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
  const isDark = resolved === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode, resolved, isDark, colors, setMode }),
    [mode, resolved, isDark, colors, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
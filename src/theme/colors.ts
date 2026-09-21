// Compat retroativo: `colors` continua sendo a paleta escura (identidade atual).
// Novas telas devem usar `useAppTheme().colors` para suportar claro/escuro.
import { darkColors, type ThemePalette } from './palette';

export const colors: ThemePalette = darkColors;

export const gradient = {
  primaryStart: '#E50914',
  primaryMid: '#C4121B',
  primaryEnd: '#8A0B11',
  mutedStart: '#1A1A1A',
  mutedEnd: '#242424',
  darkStart: '#080808',
  darkEnd: '#121212',
} as const;
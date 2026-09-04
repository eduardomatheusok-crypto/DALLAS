import type { SetCategory } from '../models';
import { colors } from './colors';

export interface CategoryTheme {
  label: string;
  short: string;
  prefix: string;
  accent: string;
  accentLight: string;
  dot: string;
}

/**
 * Token visual por categoria de série, usado na tela de execução e no
 * detalhamento do exercício para diferenciar claramente cada tipo de série.
 *
 * A categoria "válida" (a que entra nas métricas) usa o vermelho de assinatura;
 * aquecimento e preparatórias usam cinzas discretos para não competir.
 */
export const SET_CATEGORY_THEME: Record<SetCategory, CategoryTheme> = {
  warmup: {
    label: 'Aquecimento',
    short: 'AQUEC.',
    prefix: 'A',
    accent: colors.textSecondary,
    accentLight: 'rgba(255, 255, 255, 0.06)',
    dot: colors.textSecondary,
  },
  preparation: {
    label: 'Preparatória',
    short: 'PREP.',
    prefix: 'P',
    accent: colors.textSecondary,
    accentLight: 'rgba(255, 255, 255, 0.06)',
    dot: colors.textSecondary,
  },
  working: {
    label: 'Válida',
    short: 'VÁLIDAS',
    prefix: 'S',
    accent: colors.primary,
    accentLight: colors.scrim,
    dot: colors.primary,
  },
};

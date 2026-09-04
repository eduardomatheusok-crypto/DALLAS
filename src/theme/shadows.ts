import { ViewStyle } from 'react-native';

// Sombras discretas — sem glow chamativo. As bordas e o fundo carvão
// dão a profundidade da interface, não as sombras.
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
} satisfies Record<string, ViewStyle>;

export type ShadowName = keyof typeof shadows;

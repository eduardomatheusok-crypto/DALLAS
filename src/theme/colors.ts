// Logo DALLAS — identidade visual
//
// PRETO DOMINANTE · VERMELHO DE AÇÃO · BRANCO DE DESTAQUE
// A maior parte da interface é preta/branca/cinza.
// O vermelho (colors.primary / accent) é reservado para ação, energia,
// performance e momentos-chave. Não usar roxo/rosa como cor principal.

export const colors = {
  // Fundos
  background: '#080808',
  surface: '#121212',
  card: '#181818',
  elevated: '#202020',
  surfaceLight: '#242424',
  surfaceLighter: '#2E2E2E',

  // Texto
  text: '#F5F5F5',
  textSecondary: '#969696',
  textMuted: '#666666',

  // Acento principal (vermelho de assinatura).
  primary: '#E50914',
  primaryDark: '#B00610',
  primaryLight: '#FF4D55',
  accent: '#E50914',

  // Verde apenas quando semanticamente necessário e discreto.
  success: '#34D399',
  successDark: '#0E9F6E',
  successLight: 'rgba(52, 211, 153, 0.10)',

  danger: '#E50914',
  dangerDark: '#B00610',
  dangerLight: 'rgba(229, 9, 20, 0.12)',

  // Estrutura
  border: '#292929',
  borderLight: '#1E1E1E',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.72)',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(229, 9, 20, 0.12)',
  scrimSubtle: 'rgba(255, 255, 255, 0.04)',
} as const;

export const gradient = {
  primaryStart: '#E50914',
  primaryMid: '#C4121B',
  primaryEnd: '#8A0B11',
  mutedStart: '#1A1A1A',
  mutedEnd: '#242424',
  darkStart: '#080808',
  darkEnd: '#121212',
} as const;

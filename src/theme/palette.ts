// Paletas DALLAS — identidade visual
//
// PRETO DOMINANTE · VERMELHO DE AÇÃO · BRANCO DE DESTAQUE
// A maior parte da interface é preta/branca/cinza.
// O vermelho (primary / accent) é reservado para ação, energia,
// performance e momentos-chave. Não usar roxo/rosa como cor principal.
//
// darkColors mantém a identidade atual do app.
// lightColors é a versão coerente da mesma identidade (fundo claro,
// superfícies brancas, texto preto e o mesmo vermelho de assinatura).

export interface ThemePalette {
  background: string;
  surface: string;
  card: string;
  elevated: string;
  surfaceLight: string;
  surfaceLighter: string;

  text: string;
  textSecondary: string;
  textMuted: string;

  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;

  success: string;
  successDark: string;
  successLight: string;

  danger: string;
  dangerDark: string;
  dangerLight: string;

  border: string;
  borderLight: string;
  white: string;
  black: string;
  overlay: string;
  cardShadow: string;
  scrim: string;
  scrimSubtle: string;
}

export const darkColors: ThemePalette = {
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
};

export const lightColors: ThemePalette = {
  // Fundos
  background: '#F6F6F3',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#F1F1ED',
  surfaceLight: '#ECECEA',
  surfaceLighter: '#E4E4E1',

  // Texto
  text: '#151515',
  textSecondary: '#5A5A5A',
  textMuted: '#8A8A8A',

  // Acento principal (mesmo vermelho de assinatura).
  primary: '#E50914',
  primaryDark: '#B00610',
  primaryLight: '#FF4D55',
  accent: '#E50914',

  // Verde apenas quando semanticamente necessário e discreto.
  success: '#12A87B',
  successDark: '#0E9F6E',
  successLight: 'rgba(18, 168, 123, 0.10)',

  danger: '#D9040F',
  dangerDark: '#B00610',
  dangerLight: 'rgba(229, 9, 20, 0.10)',

  // Estrutura
  border: '#E3E3E0',
  borderLight: '#ECECEA',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.55)',
  cardShadow: 'rgba(0, 0, 0, 0.12)',
  scrim: 'rgba(229, 9, 20, 0.08)',
  scrimSubtle: 'rgba(0, 0, 0, 0.03)',
};
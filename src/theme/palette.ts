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
  background: '#0A0A0C',
  surface: '#121214',
  card: '#141416',
  elevated: '#1C1C20',
  surfaceLight: '#222226',
  surfaceLighter: '#2C2C32',

  // Texto
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Acento principal (vermelho de assinatura DALLAS).
  primary: '#FF1E27',
  primaryDark: '#D60E16',
  primaryLight: '#FF4D55',
  accent: '#FF1E27',

  // Verde apenas quando semanticamente necessário e discreto.
  success: '#22C55E',
  successDark: '#16A34A',
  successLight: 'rgba(34, 197, 94, 0.12)',

  danger: '#FF1E27',
  dangerDark: '#D60E16',
  dangerLight: 'rgba(255, 30, 39, 0.14)',

  // Estrutura
  border: '#26262B',
  borderLight: '#1C1C20',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.75)',
  cardShadow: 'rgba(0, 0, 0, 0.6)',
  scrim: 'rgba(255, 30, 39, 0.14)',
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
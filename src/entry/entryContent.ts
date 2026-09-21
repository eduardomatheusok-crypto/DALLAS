import type { ImageSourcePropType } from 'react-native';

/**
 * Conteúdo da experiência de entrada do DALLAS.
 *
 * Centralizado aqui para que o visual (imagem, textos, CTAs) possa ser trocado
 * sem tocar nas telas — hoje é um asset local e pode evoluir para imagem remota
 * ou vídeo/hero animado mantendo a mesma interface.
 */
export const entryContent = {
  brand: 'DALLAS',
  tagline: 'Sua força começa aqui.',
  primaryAction: 'ENTRAR',
  secondaryAction: 'CRIAR CONTA',
  login: {
    title: 'Entrar',
    subtitle: 'Continue sua evolução, sequência e treinos.',
    usernamePlaceholder: 'ex.: atleta',
    passwordPlaceholder: '••••••••',
  },
  hero: {
    image: require('../../icon/dallas_inicio.jpeg') as ImageSourcePropType,
  },
} as const;
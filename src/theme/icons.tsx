import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './colors';

export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  nav: 24,
} as const;

export type IconSize = keyof typeof iconSizes;
export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Mapa de ícones padronizados do DALLAS.
 * Todas as chaves apontam para nomes válidos do Ionicons (mesma família).
 */
export const appIcons = {
  // Navegação
  home: 'home-outline',
  homeActive: 'home',
  workout: 'barbell-outline',
  workoutActive: 'barbell',
  exercises: 'fitness-outline',
  exercisesActive: 'fitness',
  evolution: 'trending-up-outline',
  evolutionActive: 'trending-up',
  community: 'people-outline',
  communityActive: 'people',
  profile: 'person-outline',
  profileActive: 'person',
  person: 'person',
  personOutline: 'person-outline',
  people: 'people',

  // Ações
  play: 'play',
  playCircle: 'play-circle',
  plus: 'add',
  close: 'close',
  check: 'checkmark',
  checkCircle: 'checkmark-circle',
  chevronRight: 'chevron-forward',
  chevronDown: 'chevron-down',
  edit: 'create-outline',
  trash: 'trash-outline',
  notes: 'document-text-outline',
  search: 'search',
  settings: 'settings-outline',
  more: 'ellipsis-horizontal',

  // Estados
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  empty: 'file-tray-outline',

  // Métricas
  calendar: 'calendar-outline',
  clock: 'time-outline',
  flame: 'flame',
  trophy: 'trophy-outline',
  target: 'locate-outline',
  stats: 'stats-chart',
  weight: 'barbell-outline',
  muscle: 'fitness-outline',
  pause: 'pause',
  refresh: 'refresh',
  arrowUp: 'arrow-up',
  arrowDown: 'arrow-down',
  layers: 'layers-outline',
  trendUp: 'trending-up',
  repeat: 'repeat',
  checkmarkDone: 'checkmark-done',
  info: 'information-circle-outline',
  addCircle: 'add-circle',
  camera: 'camera-outline',
  share: 'share-social-outline',
  water: 'water-outline',
  calories: 'flame-outline',
  streak: 'flame',
  flash: 'flash',
  lightning: 'flash-outline',
  medal: 'medal-outline',
  cup: 'trophy-outline',
  globe: 'globe-outline',
  lock: 'lock-closed-outline',
  bell: 'notifications-outline',
  pencil: 'pencil-outline',
  duplicate: 'copy-outline',
  menuHorizontal: 'ellipsis-horizontal',
  menuVertical: 'ellipsis-vertical',
  remove: 'remove',
  add: 'add',
  chevronLeft: 'chevron-back',
  heart: 'heart-outline',
  filter: 'filter-outline',
  backlog: 'list-outline',
  dumbbell: 'barbell-outline',
} satisfies Record<string, IconName>;

export type AppIconName = keyof typeof appIcons;

interface IconProps {
  name: IconName | AppIconName;
  size?: IconSize | number;
  color?: string;
  style?: object;
}

export function Icon({ name, size = 'md', color = colors.textSecondary, style }: IconProps) {
  const resolved: IconName = appIcons[name as AppIconName] ?? (name as IconName);
  const px = typeof size === 'number' ? size : iconSizes[size];
  return <Ionicons name={resolved} size={px} color={color} style={style} />;
}

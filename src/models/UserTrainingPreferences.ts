export type TrainingFrequency = '2-3x' | '3-4x' | '4-5x';

export type TrainingGoal = 'gain-mass' | 'strength' | 'performance' | 'physique';

export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TrainingFrequencyOption {
  value: TrainingFrequency;
  label: string;
}

export interface TrainingGoalOption {
  value: TrainingGoal;
  label: string;
}

export interface WeekDayOption {
  value: WeekDay;
  label: string;
}

export const TRAINING_FREQUENCIES: TrainingFrequencyOption[] = [
  { value: '2-3x', label: '2–3x na semana' },
  { value: '3-4x', label: '3–4x na semana' },
  { value: '4-5x', label: '4–5x na semana' },
];

export const TRAINING_GOALS: TrainingGoalOption[] = [
  { value: 'gain-mass', label: 'Ganhar massa' },
  { value: 'strength', label: 'Aumentar força' },
  { value: 'performance', label: 'Melhorar desempenho' },
  { value: 'physique', label: 'Evoluir no físico' },
];

export const WEEK_DAYS: WeekDayOption[] = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

/**
 * Preferências de treino do usuário — separadas conceitualmente dos dados de conta.
 *
 * - frequency: frequência desejada/mínima por semana (não são dias específicos).
 * - trainingDays: dias planejados de treino (multi-seleção).
 * - goal: objetivo principal atual (extensível futuramente).
 *
 * A Home e o sistema de disciplina/streak devem ler `trainingDays` para distinguir
 * TREINO / DESCANSO / FALTA (ver `plannedDayStatus` abaixo).
 */
export interface UserTrainingPreferences {
  userId: string;
  frequency: TrainingFrequency;
  trainingDays: WeekDay[];
  goal: TrainingGoal;
  updatedAt: string;
}

/** Resultado de um dia para o usuário, segundo a rotina configurada. */
export type PlannedDayStatus = 'training' | 'rest' | 'missed';

/**
 * Classifica o estado de um dia da semana:
 * - 'rest'    → não era dia planejado de treino (descanso; NUNCA conta como falta);
 * - 'training'→ dia planejado e treino realizado;
 * - 'missed'  → dia era planejado de treino e NÃO foi realizado (falta).
 */
export function plannedDayStatus(
  prefs: UserTrainingPreferences | null | undefined,
  weekday: WeekDay,
  trained: boolean,
): PlannedDayStatus {
  if (!prefs || !prefs.trainingDays.includes(weekday)) return 'rest';
  return trained ? 'training' : 'missed';
}

/** Dias planejados de treino a partir da frequência desejada (seleção mínima). */
export function frequencyWorkingSet(frequency: TrainingFrequency): number {
  switch (frequency) {
    case '2-3x':
      return 2;
    case '3-4x':
      return 3;
    case '4-5x':
      return 4;
  }
}

export const hasTrainingPreferences = (
  prefs: UserTrainingPreferences | null | undefined,
): prefs is UserTrainingPreferences =>
  !!prefs &&
  !!prefs.frequency &&
  Array.isArray(prefs.trainingDays) &&
  prefs.trainingDays.length > 0 &&
  !!prefs.goal;
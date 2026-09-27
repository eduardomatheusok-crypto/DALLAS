export type TrainingFrequency = '2-3x' | '3-4x' | '4-5x';

export type ExactFrequency = 2 | 3 | 4 | 5 | 6;

export type TrainingGoal = 'gain-mass' | 'strength' | 'physique' | 'conditioning';

export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';

export type TrainingLocation = 'gym' | 'home' | 'bodyweight';

export type TrainingPreference = 'auto' | string;

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
  description?: string;
}

export interface TrainingExperienceOption {
  value: TrainingExperience;
  label: string;
  description: string;
}

export interface TrainingLocationOption {
  value: TrainingLocation;
  label: string;
}

export interface TrainingPreferenceOption {
  value: TrainingPreference;
  label: string;
  badge?: string;
}

export interface TrainingSplitOption {
  id: string;
  name: string;
  description: string;
  frequencies: ExactFrequency[];
  recommended?: boolean;
}

export interface WeekDayOption {
  value: WeekDay;
  label: string;
  shortLabel: string;
}

export const TRAINING_FREQUENCIES: TrainingFrequencyOption[] = [
  { value: '2-3x', label: '2–3x na semana' },
  { value: '3-4x', label: '3–4x na semana' },
  { value: '4-5x', label: '4–5x na semana' },
];

export const EXACT_FREQUENCIES: { value: ExactFrequency; label: string }[] = [
  { value: 2, label: '2 dias' },
  { value: 3, label: '3 dias' },
  { value: 4, label: '4 dias' },
  { value: 5, label: '5 dias' },
  { value: 6, label: '6 dias' },
];

export const TRAINING_GOALS: TrainingGoalOption[] = [
  { value: 'gain-mass', label: 'Ganhar massa muscular (Hipertrofia)', description: 'Foco em hipertrofia e desenvolvimento muscular máximo' },
  { value: 'physique', label: 'Perder gordura (Definição)', description: 'Foco em queima calórica, tônus e definição corporal' },
  { value: 'strength', label: 'Ganhar força máxima', description: 'Progressão agressiva de cargas e superação de recordes' },
  { value: 'conditioning', label: 'Melhorar condicionamento físico', description: 'Resistência, capacidade cardiorrespiratória e vigor' },
];

export const TRAINING_EXPERIENCES: TrainingExperienceOption[] = [
  {
    value: 'beginner',
    label: 'Iniciante (menos de 1 ano)',
    description: 'Ainda aprendendo postura correta e conhecendo os aparelhos.',
  },
  {
    value: 'intermediate',
    label: 'Intermediário (1 a 3 anos)',
    description: 'Domina execuções básicas, treina com constância e já controla cargas.',
  },
  {
    value: 'advanced',
    label: 'Avançado (mais de 3 anos)',
    description: 'Treina pesado com técnica sólida, periodização e busca superação de recordes.',
  },
];

export const TRAINING_SPLITS: TrainingSplitOption[] = [
  { id: 'manual', name: 'Por mim', description: 'Quero montar meus próprios treinos. Nenhum treino será criado automaticamente.', frequencies: [2,3,4,5,6] },
  { id: 'UPPER_LOWER_4X', name: 'Upper / Lower — 4 dias', description: 'Upper A, Lower A, Upper B e Lower B.', frequencies: [4] },
  { id: 'ANTERIOR_POSTERIOR_4X', name: 'Anterior / Posterior — 4 dias', description: 'Cadeias frontal e posterior em quatro sessões.', frequencies: [4] },
  { id: 'PPL_UPPER_LOWER_5X', name: 'PPLUL — 5 dias', description: 'Push, Pull, Legs, Upper e Lower.', frequencies: [5] },
  { id: 'FULL_BODY_3X', name: 'Full Body — 3 dias', description: 'Corpo inteiro nas sessões A, B e C.', frequencies: [3] },
];

export const TRAINING_LOCATIONS: TrainingLocationOption[] = [
  { value: 'gym', label: 'Academia completa' },
  { value: 'home', label: 'Academia em casa' },
  { value: 'bodyweight', label: 'Peso corporal' },
];

export const TRAINING_PREFERENCES: TrainingPreferenceOption[] = [
  { value: 'auto', label: 'Deixar o DALLAS escolher por mim', badge: 'Recomendado' },
  { value: 'custom', label: 'Quero escolher uma divisão' },
];

export const WEEK_DAYS: WeekDayOption[] = [
  { value: 'monday', label: 'Segunda-feira', shortLabel: 'SEG' },
  { value: 'tuesday', label: 'Terça-feira', shortLabel: 'TER' },
  { value: 'wednesday', label: 'Quarta-feira', shortLabel: 'QUA' },
  { value: 'thursday', label: 'Quinta-feira', shortLabel: 'QUI' },
  { value: 'friday', label: 'Sexta-feira', shortLabel: 'SEX' },
  { value: 'saturday', label: 'Sábado', shortLabel: 'SÁB' },
  { value: 'sunday', label: 'Domingo', shortLabel: 'DOM' },
];

export interface UserTrainingPreferences {
  userId: string;
  goal: TrainingGoal;
  experience?: TrainingExperience;
  frequency?: TrainingFrequency;
  exactFrequency?: ExactFrequency;
  trainingDays: WeekDay[];
  location?: TrainingLocation;
  plannedSets?: number;
  plannedReps?: number;
  preference?: TrainingPreference;
  assignedTemplateId?: string;
  onboardingCompleted?: boolean;
  updatedAt: string;
}

export type PlannedDayStatus = 'training' | 'rest' | 'missed';

export function plannedDayStatus(
  prefs: UserTrainingPreferences | null | undefined,
  weekday: WeekDay,
  trained: boolean,
): PlannedDayStatus {
  if (!prefs || !prefs.trainingDays.includes(weekday)) return 'rest';
  return trained ? 'training' : 'missed';
}

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
  Array.isArray(prefs.trainingDays) &&
  prefs.trainingDays.length > 0 &&
  !!prefs.goal;
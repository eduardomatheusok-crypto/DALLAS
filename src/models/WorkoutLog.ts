export type SetType =
  | 'normal'
  | 'drop'
  | 'backoff'
  | 'myo'
  | 'cluster'
  | 'biset'
  | 'giant'
  | 'superset'
  | 'forcada'
  | 'parcial';

/**
 * Categoria da série dentro do exercício.
 * - warmup: aquecimento (registrada no histórico, não conta nas métricas).
 * - preparation: preparatória (registrada no histórico, não conta como válida).
 * - working: válida (contabilizada em volume e desempenho).
 */
export type SetCategory = 'warmup' | 'preparation' | 'working';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  type: SetType;
  /** Categoria da série. Ausente em dados antigos => tratada como `working`. */
  category?: SetCategory;
}

/**
 * Bloco de uma técnica avançada (ex.: mini-séries de um Myo, clusters de um
 * Cluster set). Estado registrado por execução.
 */
export interface WorkoutLogBlock {
  order: number;
  targetReps: number;
  weight: number;
  completed: boolean;
}

/** Verdadeiro quando a série é válida (deve entrar nas métricas de desempenho). */
export const isWorkingSet = (s: Pick<WorkoutSet, 'category'>): boolean =>
  (s.category ?? 'working') === 'working';

export const SET_CATEGORY_LABEL: Record<SetCategory, string> = {
  warmup: 'Aquecimento',
  preparation: 'Preparatória',
  working: 'Válida',
};

/** Prefixo de rótulo por categoria (ex.: A1, P1, S1). */
export const SET_CATEGORY_PREFIX: Record<SetCategory, string> = {
  warmup: 'A',
  preparation: 'P',
  working: 'S',
};

export interface WorkoutLogExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  plannedSets: number;
  plannedReps: number;
  notes?: string;
  /** Blocos da técnica avançada executada (quando aplicável). */
  blocks?: WorkoutLogBlock[];
  sets: WorkoutSet[];
  completed: boolean;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  exercises: WorkoutLogExercise[];
  totalVolume: number;
}

export const SET_TYPES: { value: SetType; label: string; short: string }[] = [
  { value: 'normal', label: 'Válida', short: 'V' },
  { value: 'drop', label: 'Drop set', short: 'DS' },
  { value: 'backoff', label: 'Back-off', short: 'BO' },
  { value: 'myo', label: 'Myo reps', short: 'MYO' },
  { value: 'cluster', label: 'Cluster set', short: 'CL' },
  { value: 'biset', label: 'Bisset', short: 'BS' },
  { value: 'giant', label: 'Giant set', short: 'GS' },
  { value: 'superset', label: 'Superset', short: 'SS' },
  { value: 'forcada', label: 'Forçada', short: 'FO' },
  { value: 'parcial', label: 'Parcial', short: 'PA' },
];

export const SET_TYPE_LABEL: Record<SetType, string> = Object.fromEntries(
  SET_TYPES.map((t) => [t.value, t.label]),
) as Record<SetType, string>;

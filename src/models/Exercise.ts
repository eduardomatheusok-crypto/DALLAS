export type MuscleGroup =
  | 'Peito'
  | 'Costas'
  | 'Pernas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Abdômen'
  | 'Glúteos'
  | 'Antebraço'
  | 'Panturrilha';

export type ExerciseEquipment =
  | 'Barra'
  | 'Halteres'
  | 'Máquina'
  | 'Polia'
  | 'Peso Corporal'
  | 'Smith'
  | 'Outro';

export interface ExerciseExecutionStep {
  title: string;
  description: string;
  image?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: ExerciseEquipment;
  secondaryMuscles?: string[];
  startImage?: string;
  endImage?: string;
  gifUrl?: string;
  steps?: ExerciseExecutionStep[];
  instructions?: string[];
  dallasTip?: string;
  isCustom: boolean;
  createdAt: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Glúteos',
  'Antebraço',
  'Panturrilha',
];

export const EXERCISE_EQUIPMENTS: ExerciseEquipment[] = [
  'Barra',
  'Halteres',
  'Máquina',
  'Polia',
  'Peso Corporal',
  'Smith',
  'Outro',
];


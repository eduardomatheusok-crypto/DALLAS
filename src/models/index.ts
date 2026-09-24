export type { User } from './User';

export type {
  UserTrainingPreferences,
  TrainingFrequency,
  TrainingGoal,
  WeekDay,
  TrainingFrequencyOption,
  TrainingGoalOption,
  WeekDayOption,
  PlannedDayStatus,
} from './UserTrainingPreferences';
export {
  TRAINING_FREQUENCIES,
  TRAINING_GOALS,
  WEEK_DAYS,
  plannedDayStatus,
  frequencyWorkingSet,
  hasTrainingPreferences,
} from './UserTrainingPreferences';

export type {
  Exercise,
  MuscleGroup,
  ExerciseEquipment,
  ExerciseExecutionStep,
} from './Exercise';
export { MUSCLE_GROUPS, EXERCISE_EQUIPMENTS } from './Exercise';

export type {
  Workout,
  WorkoutExercisePlan,
} from './Workout';
export {
  planTotalSets,
  planWorkingSets,
  planWarmupSets,
  planPreparationSets,
  planSetCategories,
} from './Workout';

export type {
  WorkoutLog,
  WorkoutLogExercise,
  WorkoutSet,
  WorkoutLogBlock,
  SetType,
  SetCategory,
} from './WorkoutLog';
export {
  SET_TYPES,
  SET_TYPE_LABEL,
  SET_CATEGORY_LABEL,
  SET_CATEGORY_PREFIX,
  isWorkingSet,
} from './WorkoutLog';

export type {
  AdvancedTechnique,
  AdvancedTechniqueKind,
  AdvancedTechniqueExercise,
  AdvancedTechniqueMeta,
  TechniqueComposition,
} from './AdvancedTechnique';
export {
  ADVANCED_TECHNIQUES,
  ADVANCED_TECHNIQUE_META,
  techniqueName,
  isCompositeTechnique,
  exBlocksFor,
} from './AdvancedTechnique';

export type { GroupSummary, Group, Member } from './Group';
export type { Competition, CompetitionStatus, RankingEntry, RankingStats } from './Competition';
export type { ChatMessage } from './ChatMessage';

export type { TrainingSettings } from './TrainingSettings';
export {
  DEFAULT_REST_OPTIONS,
  DEFAULT_TRAINING_SETTINGS,
  createDefaultTrainingSettings,
} from './TrainingSettings';

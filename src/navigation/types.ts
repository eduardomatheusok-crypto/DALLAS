import type { WorkoutSummary } from '../models/WorkoutSummary';
export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  WorkoutDetail: { workoutId: string };
  WorkoutForm: { workoutId?: string };
  WorkoutExerciseConfig: { workoutId: string; exerciseId: string };
  ExerciseExecution: { workoutId: string };
  ActiveExerciseDetail: { workoutId: string; exerciseId: string; exerciseIndex?: number };
  WorkoutComplete: WorkoutSummary;
  Settings: undefined;
  LogDetail: { logId: string };
  ExerciseProgress: { exerciseId: string; name: string };
  GroupDetail: { groupId: string };
  GroupForm: undefined;
  CompetitionForm: { groupId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Community: undefined;
  Evolution: undefined;
  Profile: undefined;
};

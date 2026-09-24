export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  WorkoutDetail: { workoutId: string };
  WorkoutForm: { workoutId?: string };
  WorkoutExerciseConfig: { workoutId: string; exerciseId: string };
  ExerciseExecution: { workoutId: string };
  ActiveExerciseDetail: { workoutId: string; exerciseId: string; exerciseIndex?: number };
  WorkoutComplete: { durationSeconds: number; volume: number; series: number };
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

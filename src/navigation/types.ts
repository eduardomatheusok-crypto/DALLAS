export type RootStackParamList = {
  MainTabs: undefined;
  WorkoutDetail: { workoutId: string };
  WorkoutForm: { workoutId?: string };
  WorkoutExerciseConfig: { workoutId: string; exerciseId: string };
  ExerciseExecution: { workoutId: string };
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

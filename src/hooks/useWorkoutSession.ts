import { useMemo, useSyncExternalStore } from 'react';
import { workoutSessionService } from '../services';
import { isWorkingSet } from '../models';

export function useWorkoutSession() {
  const snapshot = useSyncExternalStore(
    workoutSessionService.subscribe,
    workoutSessionService.getSnapshot,
  );

  const exercises = snapshot.exercises;

  const completedCount = useMemo(
    () => exercises.filter((e) => e.completed).length,
    [exercises],
  );

  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? completedCount / totalExercises : 0;

  const completedSets = useMemo(
    () => exercises.reduce(
      (acc, e) => acc + e.sets.filter((s) => s.completed).length,
      0,
    ),
    [exercises],
  );

  const totalSets = useMemo(
    () => exercises.reduce((acc, e) => acc + e.sets.length, 0),
    [exercises],
  );

  const workingSetsDone = useMemo(
    () => exercises.reduce(
      (acc, e) => acc + e.sets.filter((s) => s.completed && isWorkingSet(s)).length,
      0,
    ),
    [exercises],
  );

  return {
    ...snapshot,
    completedCount,
    totalExercises,
    progress,
    completedSets,
    totalSets,
    workingSetsDone,
    startSession: workoutSessionService.startSession,
    toggleExerciseCompleted: workoutSessionService.toggleExerciseCompleted,
    toggleSetCompleted: workoutSessionService.toggleSetCompleted,
    updateSet: workoutSessionService.updateSet,
    bumpWeight: workoutSessionService.bumpWeight,
    addSet: workoutSessionService.addSet,
    updateNotes: workoutSessionService.updateNotes,
    toggleBlock: workoutSessionService.toggleBlock,
    addExerciseToSession: workoutSessionService.addExerciseToSession,
    replaceExercise: workoutSessionService.replaceExercise,
    finishSession: workoutSessionService.finishSession,
    clearSession: workoutSessionService.clearSession,
    onRestTrigger: workoutSessionService.onRestTrigger,
  };
}

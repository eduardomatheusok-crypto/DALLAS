package com.fittreino.workoutlog;

import java.util.List;

public record WorkoutLogRequest(
        String workoutId,
        String workoutName,
        String startedAt,
        String finishedAt,
        List<WorkoutLogExerciseIn> exercises
) {

    public record WorkoutLogExerciseIn(
            String exerciseId,
            String exerciseName,
            String muscleGroup,
            int order,
            int plannedSets,
            int plannedReps,
            boolean done,
            String notes,
            List<AdvancedTechniqueBlockIn> blocks,
            List<WorkoutSetIn> sets
    ) {}

    public record AdvancedTechniqueBlockIn(
            int order,
            int targetReps,
            double weight,
            boolean completed
    ) {}

    public record WorkoutSetIn(
            String id,
            int setNumber,
            double weight,
            int reps,
            boolean done,
            String type
    ) {}
}

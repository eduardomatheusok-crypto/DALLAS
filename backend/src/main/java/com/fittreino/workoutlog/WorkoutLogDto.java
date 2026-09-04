package com.fittreino.workoutlog;

import java.time.Instant;
import java.util.List;

public record WorkoutLogDto(
        String id,
        String workoutId,
        String workoutName,
        Instant startedAt,
        Instant finishedAt,
        long durationSeconds,
        List<WorkoutLogExerciseDto> exercises,
        double totalVolume
) {
    public static WorkoutLogDto from(WorkoutLogEntity e) {
        return new WorkoutLogDto(
                e.getId(),
                e.getWorkoutId(),
                e.getWorkoutName(),
                e.getStartedAt(),
                e.getFinishedAt(),
                e.getDurationSeconds(),
                e.getExercises().stream().map(WorkoutLogExerciseDto::from).toList(),
                e.getTotalVolume()
        );
    }
}

package com.fittreino.dto.response;

import com.fittreino.model.WorkoutEntity;

import java.time.Instant;
import java.util.List;
public record WorkoutDto(
        String id,
        String name,
        List<WorkoutExercisePlanDto> exercises,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkoutDto from(WorkoutEntity e) {
        return new WorkoutDto(
                e.getId(),
                e.getName(),
                e.getExercises().stream().map(WorkoutExercisePlanDto::from).toList(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}

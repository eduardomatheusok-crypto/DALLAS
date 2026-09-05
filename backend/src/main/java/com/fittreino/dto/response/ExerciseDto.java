package com.fittreino.dto.response;

import com.fittreino.model.ExerciseEntity;

import java.time.Instant;
public record ExerciseDto(
        String id,
        String name,
        String muscleGroup,
        boolean custom,
        Instant createdAt
) {
    public static ExerciseDto from(ExerciseEntity e) {
        return new ExerciseDto(e.getId(), e.getName(), e.getMuscleGroup(), e.isCustom(), e.getCreatedAt());
    }
}

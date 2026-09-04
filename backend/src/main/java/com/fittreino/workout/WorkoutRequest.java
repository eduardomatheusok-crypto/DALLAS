package com.fittreino.workout;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Map;

public record WorkoutRequest(
        @NotBlank String name,
        @NotEmpty @Valid List<WorkoutExercisePlanDtoIn> exercises
) {

    public record WorkoutExercisePlanDtoIn(
            String id,
            String exerciseId,
            int order,
            int plannedSets,
            int plannedReps,
            Double initialWeight,
            Integer warmupSets,
            Integer preparationSets,
            Integer workingSets,
            Map<String, Object> advancedTechnique
    ) {}
}

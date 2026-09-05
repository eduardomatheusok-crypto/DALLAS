package com.fittreino.dto.response;

import com.fittreino.model.WorkoutExercisePlanEntity;
import com.fittreino.service.WorkoutService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
public record WorkoutExercisePlanDto(
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
) {
    public static WorkoutExercisePlanDto from(WorkoutExercisePlanEntity e) {
        return new WorkoutExercisePlanDto(
                e.getId(),
                e.getExerciseId(),
                e.getExerciseOrder(),
                e.getPlannedSets(),
                e.getPlannedReps(),
                e.getInitialWeight(),
                e.getWarmupSets(),
                e.getPreparationSets(),
                e.getWorkingSets(),
                WorkoutService.parseTechnique(e.getAdvancedTechnique())
        );
    }
}

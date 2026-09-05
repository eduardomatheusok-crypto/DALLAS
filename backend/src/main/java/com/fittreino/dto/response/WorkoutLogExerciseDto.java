package com.fittreino.dto.response;

import com.fittreino.model.WorkoutLogExerciseEntity;
import com.fittreino.service.WorkoutLogService;

import java.util.List;
public record WorkoutLogExerciseDto(
        String id,
        String exerciseId,
        String exerciseName,
        String muscleGroup,
        int order,
        int plannedSets,
        int plannedReps,
        boolean done,
        String notes,
        List<AdvancedTechniqueBlockDto> blocks,
        List<WorkoutSetDto> sets
) {
    public static WorkoutLogExerciseDto from(WorkoutLogExerciseEntity e) {
        return new WorkoutLogExerciseDto(
                e.getId(),
                e.getExerciseId(),
                e.getExerciseName(),
                e.getMuscleGroup(),
                e.getExerciseOrder(),
                e.getPlannedSets(),
                e.getPlannedReps(),
                e.isDone(),
                e.getNotes(),
                WorkoutLogService.parseBlocks(e.getBlocks()),
                e.getSets().stream().map(WorkoutSetDto::from).toList()
        );
    }
}

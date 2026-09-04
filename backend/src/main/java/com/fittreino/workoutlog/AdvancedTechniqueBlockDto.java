package com.fittreino.workoutlog;

public record AdvancedTechniqueBlockDto(
        int order,
        int targetReps,
        double weight,
        boolean completed
) {}
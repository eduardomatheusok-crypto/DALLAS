package com.fittreino.dto.response;

public record AdvancedTechniqueBlockDto(
        int order,
        int targetReps,
        double weight,
        boolean completed
) {}

package com.fittreino.dto.request;

import jakarta.validation.constraints.NotBlank;
public record CreateExerciseRequest(
        @NotBlank String name,
        @NotBlank String muscleGroup
) {}

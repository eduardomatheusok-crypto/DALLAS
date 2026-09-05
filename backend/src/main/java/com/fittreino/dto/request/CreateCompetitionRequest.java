package com.fittreino.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
public record CreateCompetitionRequest(
        @NotBlank(message = "Nome da competição é obrigatório")
        @Size(max = 80)
        String name,

        @Size(max = 400)
        String description,

        @NotNull(message = "Data de início é obrigatória")
        String startsAt,

        @NotNull(message = "Data de término é obrigatória")
        String endsAt,

        Integer awardedPositions
) {}
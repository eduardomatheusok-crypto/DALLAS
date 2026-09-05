package com.fittreino.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record CreateGroupRequest(
        @NotBlank(message = "Nome do grupo é obrigatório")
        @Size(max = 80)
        String name,

        @Size(max = 300)
        String description,

        @Size(max = 16)
        String icon
) {}
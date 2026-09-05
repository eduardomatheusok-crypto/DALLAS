package com.fittreino.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record JoinGroupRequest(
        @NotBlank(message = "Código de convite é obrigatório")
        @Size(min = 6, max = 8)
        String inviteCode
) {}
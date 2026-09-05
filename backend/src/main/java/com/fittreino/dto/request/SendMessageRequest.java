package com.fittreino.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record SendMessageRequest(
        @NotBlank(message = "Mensagem vazia")
        @Size(max = 1000)
        String text
) {}
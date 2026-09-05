package com.fittreino.dto.request;

public record CreateUserRequest(
        String name,
        String deviceId
) {}

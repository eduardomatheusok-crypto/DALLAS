package com.fittreino.user;

public record CreateUserRequest(
        String name,
        String deviceId
) {}

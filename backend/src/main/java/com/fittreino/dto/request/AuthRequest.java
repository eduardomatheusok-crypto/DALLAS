package com.fittreino.dto.request;

public record AuthRequest(
        String username,
        String password,
        String deviceId
) {}

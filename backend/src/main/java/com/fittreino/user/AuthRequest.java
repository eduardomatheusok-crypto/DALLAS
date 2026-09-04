package com.fittreino.user;

public record AuthRequest(
        String username,
        String password,
        String deviceId
) {}
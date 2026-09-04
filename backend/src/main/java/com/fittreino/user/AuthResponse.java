package com.fittreino.user;

public record AuthResponse(
        String token,
        UserDto user
) {}
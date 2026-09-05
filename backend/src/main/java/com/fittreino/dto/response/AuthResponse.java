package com.fittreino.dto.response;

public record AuthResponse(
        String token,
        UserDto user
) {}

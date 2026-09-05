package com.fittreino.dto.response;

import com.fittreino.model.UserEntity;

import java.time.Instant;
public record UserDto(
        String id,
        String username,
        String name,
        String deviceId,
        Instant createdAt
) {
    public static UserDto from(UserEntity e) {
        return new UserDto(e.getId(), e.getUsername(), e.getName(), e.getDeviceId(), e.getCreatedAt());
    }
}

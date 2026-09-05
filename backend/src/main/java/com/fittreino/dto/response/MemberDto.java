package com.fittreino.dto.response;

import com.fittreino.model.GroupMemberEntity;
import com.fittreino.model.UserEntity;

import java.time.Instant;
public record MemberDto(
        UserDto user,
        String role,
        Instant joinedAt
) {
    public static MemberDto from(GroupMemberEntity m, UserEntity user) {
        return new MemberDto(UserDto.from(user), m.getRole(), m.getJoinedAt());
    }
}
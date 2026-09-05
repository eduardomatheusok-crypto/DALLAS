package com.fittreino.dto.response;

import com.fittreino.model.GroupEntity;

import java.time.Instant;
import java.util.List;
public record GroupDto(
        String id,
        String name,
        String description,
        String icon,
        String inviteCode,
        String ownerId,
        boolean joined,
        String myRole,
        long memberCount,
        List<MemberDto> members,
        Instant createdAt
) {
    public static GroupDto from(GroupEntity g, String myUserId, List<MemberDto> members, long memberCount) {
        String myRole = g.getOwnerId().equals(myUserId) ? GroupEntity.ROLE_OWNER : GroupEntity.ROLE_MEMBER;
        boolean joined = myRole.equals(GroupEntity.ROLE_OWNER)
                || members.stream().anyMatch(m -> m.user().id().equals(myUserId));
        return new GroupDto(
                g.getId(),
                g.getName(),
                g.getDescription(),
                g.getIcon(),
                g.getInviteCode(),
                g.getOwnerId(),
                joined,
                myRole,
                memberCount,
                members,
                g.getCreatedAt()
        );
    }
}
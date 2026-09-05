package com.fittreino.dto.response;

import com.fittreino.model.GroupEntity;

import java.time.Instant;
public record GroupSummaryDto(
        String id,
        String name,
        String description,
        String icon,
        long memberCount,
        String ownerId,
        Instant createdAt
) {
    public static GroupSummaryDto from(GroupEntity g, long memberCount) {
        return new GroupSummaryDto(
                g.getId(),
                g.getName(),
                g.getDescription(),
                g.getIcon(),
                memberCount,
                g.getOwnerId(),
                g.getCreatedAt()
        );
    }
}
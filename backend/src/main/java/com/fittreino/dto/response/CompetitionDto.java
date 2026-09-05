package com.fittreino.dto.response;

import com.fittreino.model.CompetitionEntity;

import java.time.Instant;
public record CompetitionDto(
        String id,
        String groupId,
        String name,
        String description,
        String status,
        Instant startsAt,
        Instant endsAt,
        int awardedPositions,
        int participantCount,
        boolean joined,
        String ownerId,
        Instant createdAt
) {
    public static CompetitionDto from(CompetitionEntity c, long participantCount, String myUserId) {
        return new CompetitionDto(
                c.getId(),
                c.getGroup().getId(),
                c.getName(),
                c.getDescription(),
                c.getStatus(),
                c.getStartsAt(),
                c.getEndsAt(),
                c.getAwardedPositions(),
                (int) participantCount,
                c.getParticipants().stream().anyMatch(p -> p.getUserId().equals(myUserId)),
                c.getOwnerId(),
                c.getCreatedAt()
        );
    }
}
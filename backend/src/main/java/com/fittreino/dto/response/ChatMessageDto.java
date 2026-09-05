package com.fittreino.dto.response;

import com.fittreino.model.GroupMessageEntity;

import java.time.Instant;
public record ChatMessageDto(
        String id,
        String userId,
        String authorName,
        String text,
        boolean isSystem,
        Instant sentAt
) {
    public static ChatMessageDto from(GroupMessageEntity m) {
        return new ChatMessageDto(
                m.getId(),
                m.getUserId(),
                m.getAuthorName(),
                m.getText(),
                m.isSystem(),
                m.getSentAt()
        );
    }
}
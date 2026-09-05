package com.fittreino.service;

import com.fittreino.config.NotFoundException;
import com.fittreino.dto.request.SendMessageRequest;
import com.fittreino.dto.response.ChatMessageDto;
import com.fittreino.model.GroupMessageEntity;
import com.fittreino.model.UserEntity;
import com.fittreino.repository.GroupMemberRepository;
import com.fittreino.repository.GroupMessageRepository;
import com.fittreino.repository.GroupRepository;
import com.fittreino.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    private static final int DEFAULT_PAGE = 50;

    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupMessageRepository messageRepository;
    private final UserRepository userRepository;

    public ChatService(GroupRepository groupRepository,
                       GroupMemberRepository memberRepository,
                       GroupMessageRepository messageRepository,
                       UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> list(String userId, String groupId, Instant before, Integer limit) {
        requireMember(groupId, userId);
        int size = limit != null ? Math.max(1, Math.min(limit, 100)) : DEFAULT_PAGE;
        List<GroupMessageEntity> descending = before != null
                ? messageRepository.findByGroupIdAndSentAtBeforeOrderBySentAtDesc(groupId, before, PageRequest.of(0, size))
                : messageRepository.findByGroupIdOrderBySentAtDesc(groupId, PageRequest.of(0, size));
        return descending.stream()
                .sorted(java.util.Comparator.comparing(GroupMessageEntity::getSentAt))
                .map(ChatMessageDto::from)
                .toList();
    }

    @Transactional
    public ChatMessageDto send(String userId, String groupId, SendMessageRequest request) {
        requireMember(groupId, userId);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("usuário não encontrado"));

        GroupMessageEntity m = new GroupMessageEntity();
        m.setId(UUID.randomUUID().toString());
        m.setGroup(groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("grupo não encontrado")));
        m.setUserId(userId);
        m.setAuthorName(displayName(user));
        m.setText(request.text().trim());
        m.setSystem(false);
        m.setSentAt(Instant.now());
        return ChatMessageDto.from(messageRepository.save(m));
    }

    private void requireMember(String groupId, String userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new NotFoundException("você não participa deste grupo");
        }
    }

    private String displayName(UserEntity u) {
        if (u.getName() != null && !u.getName().isBlank()) {
            return u.getName();
        }
        return u.getUsername();
    }
}
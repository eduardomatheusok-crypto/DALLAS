package com.fittreino.service;

import com.fittreino.config.NotFoundException;
import com.fittreino.dto.request.CreateGroupRequest;
import com.fittreino.dto.response.GroupDto;
import com.fittreino.dto.response.GroupSummaryDto;
import com.fittreino.dto.response.MemberDto;
import com.fittreino.model.CompetitionEntity;
import com.fittreino.model.CompetitionParticipantEntity;
import com.fittreino.model.GroupEntity;
import com.fittreino.model.GroupMemberEntity;
import com.fittreino.model.GroupMessageEntity;
import com.fittreino.model.UserEntity;
import com.fittreino.repository.CompetitionParticipantRepository;
import com.fittreino.repository.CompetitionRepository;
import com.fittreino.repository.GroupMemberRepository;
import com.fittreino.repository.GroupMessageRepository;
import com.fittreino.repository.GroupRepository;
import com.fittreino.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class GroupService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupMessageRepository messageRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final UserRepository userRepository;

    public GroupService(GroupRepository groupRepository,
                        GroupMemberRepository memberRepository,
                        GroupMessageRepository messageRepository,
                        CompetitionRepository competitionRepository,
                        CompetitionParticipantRepository participantRepository,
                        UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.competitionRepository = competitionRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public GroupDto create(String userId, CreateGroupRequest request) {
        GroupEntity group = new GroupEntity();
        group.setId(UUID.randomUUID().toString());
        group.setName(request.name() != null ? request.name().trim() : "Novo grupo");
        group.setDescription(request.description() != null ? request.description().trim() : null);
        group.setIcon(request.icon() != null && !request.icon().isBlank() ? request.icon() : "🏋️");
        group.setInviteCode(generateUniqueCode());
        group.setOwnerId(userId);
        group.setCreatedAt(Instant.now());

        GroupMemberEntity owner = new GroupMemberEntity();
        owner.setId(UUID.randomUUID().toString());
        owner.setGroup(group);
        owner.setUserId(userId);
        owner.setRole(GroupEntity.ROLE_OWNER);
        owner.setJoinedAt(Instant.now());
        group.getMembers().add(owner);

        groupRepository.save(group);

        postSystem(group, "✨ Grupo \"" + group.getName() + "\" criado por " + displayName(requireUser(userId)) + "! Convide amigos pelo código " + group.getInviteCode() + " 🔗");
        return toDto(group, userId);
    }

    @Transactional(readOnly = true)
    public List<GroupSummaryDto> listMine(String userId) {
        return groupRepository.findAllByMembersUserIdOrderByCreatedAtDesc(userId).stream()
                .map(g -> GroupSummaryDto.from(g, memberRepository.countByGroupId(g.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupDto getById(String userId, String groupId) {
        GroupEntity group = requireGroup(groupId);
        requireMember(group, userId);
        return toDto(group, userId);
    }

    @Transactional
    public GroupDto joinByCode(String userId, com.fittreino.dto.request.JoinGroupRequest code) {
        GroupEntity group = groupRepository.findByInviteCode(code.inviteCode().trim().toUpperCase())
                .orElseThrow(() -> new NotFoundException("código de convite inválido"));
        return join(group, userId);
    }

    @Transactional
    public GroupDto joinById(String userId, String groupId) {
        return join(requireGroup(groupId), userId);
    }

    private GroupDto join(GroupEntity group, String userId) {
        if (memberRepository.existsByGroupIdAndUserId(group.getId(), userId)) {
            return toDto(group, userId);
        }
        GroupMemberEntity member = new GroupMemberEntity();
        member.setId(UUID.randomUUID().toString());
        member.setGroup(group);
        member.setUserId(userId);
        member.setRole(GroupEntity.ROLE_MEMBER);
        member.setJoinedAt(Instant.now());
        memberRepository.save(member);

        postSystem(group, "👋 " + displayName(requireUser(userId)) + " entrou no grupo!");
        return toDto(group, userId);
    }

    @Transactional
    public void leave(String userId, String groupId) {
        GroupEntity group = requireGroup(groupId);
        if (group.getOwnerId().equals(userId)) {
            throw new IllegalArgumentException("o dono não pode sair do grupo — transfira ou exclua o grupo");
        }
        GroupMemberEntity member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new NotFoundException("você não participa deste grupo"));
        memberRepository.delete(member);
        postSystem(group, "👋 " + displayName(requireUser(userId)) + " saiu do grupo.");
    }

    @Transactional
    public void delete(String userId, String groupId) {
        GroupEntity group = requireGroup(groupId);
        requireOwner(group, userId);

        for (CompetitionEntity c : competitionRepository.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            List<CompetitionParticipantEntity> participants = participantRepository.findByCompetitionId(c.getId());
            participantRepository.deleteAll(participants);
            competitionRepository.delete(c);
        }
        messageRepository.deleteAll(messageRepository.findByGroupIdOrderBySentAtAsc(groupId));
        memberRepository.deleteAll(memberRepository.findAllByGroupIdOrderByJoinedAtAsc(groupId));
        groupRepository.delete(group);
    }

    private GroupDto toDto(GroupEntity group, String userId) {
        List<MemberDto> members = memberRepository.findAllByGroupIdOrderByJoinedAtAsc(group.getId()).stream()
                .map(m -> {
                    UserEntity u = userRepository.findById(m.getUserId()).orElse(null);
                    if (u == null) return null;
                    return MemberDto.from(m, u);
                })
                .filter(java.util.Objects::nonNull)
                .toList();
        long count = memberRepository.countByGroupId(group.getId());
        return GroupDto.from(group, userId, members, count);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (groupRepository.findByInviteCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("não foi possível gerar um código de convite");
    }

    private GroupEntity requireGroup(String groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("grupo não encontrado"));
    }

    private void requireMember(GroupEntity group, String userId) {
        if (!memberRepository.existsByGroupIdAndUserId(group.getId(), userId)) {
            throw new NotFoundException("você não participa deste grupo");
        }
    }

    private void requireOwner(GroupEntity group, String userId) {
        if (!group.getOwnerId().equals(userId)) {
            throw new NotFoundException("somente o dono pode fazer isso");
        }
    }

    private UserEntity requireUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("usuário não encontrado"));
    }

    private String displayName(UserEntity u) {
        if (u.getName() != null && !u.getName().isBlank()) {
            return u.getName();
        }
        return u.getUsername();
    }

    private void postSystem(GroupEntity group, String text) {
        GroupMessageEntity m = new GroupMessageEntity();
        m.setId(UUID.randomUUID().toString());
        m.setGroup(group);
        m.setUserId(null);
        m.setAuthorName("DALLAS");
        m.setText(text);
        m.setSystem(true);
        m.setSentAt(Instant.now());
        messageRepository.save(m);
    }
}
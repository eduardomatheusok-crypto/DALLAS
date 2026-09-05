package com.fittreino.service;

import com.fittreino.config.NotFoundException;
import com.fittreino.dto.request.CreateCompetitionRequest;
import com.fittreino.dto.response.CompetitionDto;
import com.fittreino.dto.response.RankingEntryDto;
import com.fittreino.model.CompetitionEntity;
import com.fittreino.model.CompetitionParticipantEntity;
import com.fittreino.model.GroupEntity;
import com.fittreino.repository.CompetitionParticipantRepository;
import com.fittreino.repository.CompetitionRepository;
import com.fittreino.repository.GroupMemberRepository;
import com.fittreino.repository.GroupRepository;
import com.fittreino.repository.UserRepository;
import com.fittreino.dto.response.UserDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final CompetitionScoreService scoreService;

    public CompetitionService(CompetitionRepository competitionRepository,
                              CompetitionParticipantRepository participantRepository,
                              GroupRepository groupRepository,
                              GroupMemberRepository memberRepository,
                              UserRepository userRepository,
                              CompetitionScoreService scoreService) {
        this.competitionRepository = competitionRepository;
        this.participantRepository = participantRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.scoreService = scoreService;
    }

    @Transactional
    public CompetitionDto create(String userId, String groupId, CreateCompetitionRequest request) {
        GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("grupo não encontrado"));
        requireMember(groupId, userId);
        requireOwner(group, userId);

        Instant startsAt = parseInstant(request.startsAt(), "data de início inválida");
        Instant endsAt = parseInstant(request.endsAt(), "data de término inválida");
        if (!endsAt.isAfter(startsAt)) {
            throw new IllegalArgumentException("a competição deve terminar depois do início");
        }

        CompetitionEntity c = new CompetitionEntity();
        c.setId(UUID.randomUUID().toString());
        c.setGroup(group);
        c.setOwnerId(userId);
        c.setName(request.name().trim());
        c.setDescription(request.description() != null ? request.description().trim() : null);
        c.setStartsAt(startsAt);
        c.setEndsAt(endsAt);
        c.setStatus(CompetitionEntity.STATUS_PENDING);
        c.setAwardedPositions(request.awardedPositions() != null && request.awardedPositions() > 0
                ? request.awardedPositions()
                : CompetitionScoreService.defaultAwardedPositions((int) memberRepository.countByGroupId(groupId)));
        c.setLastDailyEventDate(null);
        c.setCreatedAt(Instant.now());
        competitionRepository.save(c);

        CompetitionParticipantEntity owner = new CompetitionParticipantEntity();
        owner.setId(UUID.randomUUID().toString());
        owner.setCompetition(c);
        owner.setUserId(userId);
        owner.setJoinedAt(Instant.now());
        c.getParticipants().add(owner);
        participantRepository.save(owner);

        return toDto(c, userId);
    }

    @Transactional(readOnly = true)
    public List<CompetitionDto> listByGroup(String userId, String groupId) {
        requireMember(groupId, userId);
        List<CompetitionEntity> list = competitionRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        for (CompetitionEntity c : list) {
            scoreService.applyTransitions(c);
        }
        return list.stream().map(c -> toDto(c, userId)).toList();
    }

    @Transactional
    public CompetitionDto join(String userId, String competitionId) {
        CompetitionEntity c = requireCompetition(competitionId);
        requireMember(c.getGroup().getId(), userId);
        if (CompetitionEntity.STATUS_FINISHED.equals(c.getStatus())) {
            throw new IllegalArgumentException("a competição já foi encerrada");
        }
        if (participantRepository.existsByCompetitionIdAndUserId(c.getId(), userId)) {
            return toDto(c, userId);
        }

        CompetitionParticipantEntity p = new CompetitionParticipantEntity();
        p.setId(UUID.randomUUID().toString());
        p.setCompetition(c);
        p.setUserId(userId);
        p.setJoinedAt(Instant.now());
        participantRepository.save(p);

        if (CompetitionEntity.STATUS_ACTIVE.equals(c.getStatus())) {
            scoreService.onWorkoutLogCreated(userId);
        }
        return toDto(c, userId);
    }

    @Transactional
    public List<RankingEntryDto> getRanking(String userId, String competitionId) {
        CompetitionEntity c = requireCompetition(competitionId);
        requireMember(c.getGroup().getId(), userId);
        if (!participantRepository.existsByCompetitionIdAndUserId(c.getId(), userId)) {
            throw new NotFoundException("você não participa desta competição");
        }

        scoreService.applyTransitions(c);
        if (CompetitionEntity.STATUS_ACTIVE.equals(c.getStatus())
                && participantRepository.countByCompetitionId(c.getId()) > 0) {
            scoreService.onWorkoutLogCreated(userId);
        }
        return participantRepository.findByCompetitionIdOrderByTotalScoreDescJoinedAtAsc(c.getId()).stream()
                .map(p -> RankingEntryDto.from(p, UserDto.from(userRepository.findById(p.getUserId())
                        .orElseThrow(() -> new NotFoundException("usuário não encontrado")))))
                .toList();
    }

    @Transactional
    public void finishNow(String userId, String competitionId) {
        CompetitionEntity c = requireCompetition(competitionId);
        requireOwner(c.getGroup(), userId);
        if (!CompetitionEntity.STATUS_ACTIVE.equals(c.getStatus())) {
            throw new IllegalArgumentException("somente competições ativas podem ser encerradas");
        }
        c.setEndsAt(Instant.now());
        scoreService.applyTransitions(c);
    }

    private CompetitionDto toDto(CompetitionEntity c, String userId) {
        return CompetitionDto.from(c, participantRepository.countByCompetitionId(c.getId()), userId);
    }

    private CompetitionEntity requireCompetition(String competitionId) {
        return competitionRepository.findById(competitionId)
                .orElseThrow(() -> new NotFoundException("competição não encontrada"));
    }

    private void requireMember(String groupId, String userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new NotFoundException("você não participa deste grupo");
        }
    }

    private void requireOwner(GroupEntity group, String userId) {
        if (!group.getOwnerId().equals(userId)) {
            throw new NotFoundException("somente o dono pode fazer isso");
        }
    }

    private Instant parseInstant(String value, String error) {
        try {
            return Instant.parse(value);
        } catch (Exception e) {
            throw new IllegalArgumentException(error);
        }
    }
}
package com.fittreino.repository;

import com.fittreino.model.CompetitionParticipantEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface CompetitionParticipantRepository extends JpaRepository<CompetitionParticipantEntity, String> {
    List<CompetitionParticipantEntity> findByCompetitionIdOrderByTotalScoreDescJoinedAtAsc(String competitionId);
    Optional<CompetitionParticipantEntity> findByCompetitionIdAndUserId(String competitionId, String userId);
    boolean existsByCompetitionIdAndUserId(String competitionId, String userId);
    long countByCompetitionId(String competitionId);
    List<CompetitionParticipantEntity> findByCompetitionId(String competitionId);
}
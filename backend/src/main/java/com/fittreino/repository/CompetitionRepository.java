package com.fittreino.repository;

import com.fittreino.model.CompetitionEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface CompetitionRepository extends JpaRepository<CompetitionEntity, String> {
    List<CompetitionEntity> findByGroupIdOrderByCreatedAtDesc(String groupId);
    Optional<CompetitionEntity> findFirstByGroupIdAndStatusOrderByCreatedAtDesc(String groupId, String status);
    List<CompetitionEntity> findByStatusAndParticipantsUserId(String status, String userId);
}
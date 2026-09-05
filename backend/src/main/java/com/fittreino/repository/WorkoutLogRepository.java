package com.fittreino.repository;

import com.fittreino.model.WorkoutLogEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface WorkoutLogRepository extends JpaRepository<WorkoutLogEntity, String> {
    List<WorkoutLogEntity> findAllByUserIdOrderByStartedAtDesc(String userId);
    Optional<WorkoutLogEntity> findByIdAndUserId(String id, String userId);
    List<WorkoutLogEntity> findAllByUserIdAndStartedAtBetweenOrderByStartedAtAsc(String userId, java.time.Instant start, java.time.Instant end);
}

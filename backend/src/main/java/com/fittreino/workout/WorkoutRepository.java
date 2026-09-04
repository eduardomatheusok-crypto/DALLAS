package com.fittreino.workout;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkoutRepository extends JpaRepository<WorkoutEntity, String> {
    List<WorkoutEntity> findAllByUserId(String userId);
    Optional<WorkoutEntity> findByIdAndUserId(String id, String userId);
    boolean existsByIdAndUserId(String id, String userId);
}

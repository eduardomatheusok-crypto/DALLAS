package com.fittreino.repository;

import com.fittreino.model.ExerciseEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
public interface ExerciseRepository extends JpaRepository<ExerciseEntity, String> {

    @Query("SELECT e FROM ExerciseEntity e WHERE e.userId IS NULL OR e.userId = :userId")
    List<ExerciseEntity> findAllVisibleTo(@Param("userId") String userId);

    @Query("SELECT e FROM ExerciseEntity e WHERE (e.userId IS NULL OR e.userId = :userId) AND e.muscleGroup = :muscleGroup")
    List<ExerciseEntity> findAllVisibleToByMuscleGroup(@Param("userId") String userId, @Param("muscleGroup") String muscleGroup);

    @Query("SELECT e FROM ExerciseEntity e WHERE (e.userId IS NULL OR e.userId = :userId) AND LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<ExerciseEntity> findAllVisibleToByNameContaining(@Param("userId") String userId, @Param("name") String name);

    Optional<ExerciseEntity> findByIdAndUserId(String id, String userId);

    boolean existsByIdAndUserId(String id, String userId);
}

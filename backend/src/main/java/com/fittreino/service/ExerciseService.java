package com.fittreino.service;

import com.fittreino.dto.request.CreateExerciseRequest;
import com.fittreino.dto.response.ExerciseDto;
import com.fittreino.model.ExerciseEntity;
import com.fittreino.repository.ExerciseRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class ExerciseService {

    private final ExerciseRepository repository;

    public ExerciseService(ExerciseRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ExerciseDto> getAll(String userId, String query, String muscleGroup) {
        List<ExerciseEntity> result;
        if (query != null && !query.isBlank()) {
            result = repository.findAllVisibleToByNameContaining(userId, query.trim());
        } else if (muscleGroup != null && !muscleGroup.isBlank()) {
            result = repository.findAllVisibleToByMuscleGroup(userId, muscleGroup);
        } else {
            result = repository.findAllVisibleTo(userId);
        }
        return result.stream().map(ExerciseDto::from).toList();
    }

    @Transactional(readOnly = true)
    public ExerciseDto getById(String id, String userId) {
        return repository.findByIdAndUserId(id, userId)
                .or(() -> repository.findById(id).filter(e -> e.getUserId() == null))
                .map(ExerciseDto::from)
                .orElse(null);
    }

    @Transactional
    public ExerciseDto create(String userId, CreateExerciseRequest request, boolean custom) {
        ExerciseEntity entity = new ExerciseEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setName(request.name().trim());
        entity.setMuscleGroup(request.muscleGroup());
        entity.setCustom(custom);
        entity.setUserId(custom ? userId : null);
        entity.setCreatedAt(Instant.now());
        return ExerciseDto.from(repository.save(entity));
    }
}

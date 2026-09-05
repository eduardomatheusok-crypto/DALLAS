package com.fittreino.service;

import com.fittreino.config.NotFoundException;
import com.fittreino.dto.request.WorkoutRequest;
import com.fittreino.dto.response.WorkoutDto;
import com.fittreino.model.WorkoutEntity;
import com.fittreino.model.WorkoutExercisePlanEntity;
import com.fittreino.repository.WorkoutRepository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class WorkoutService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final WorkoutRepository repository;

    public WorkoutService(WorkoutRepository repository) {
        this.repository = repository;
    }

    /** Serializa a técnica avançada (Map) para JSON para persistência em texto. */
    public static String serializeTechnique(Map<String, Object> technique) {
        if (technique == null) return null;
        try {
            return MAPPER.writeValueAsString(technique);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    /** Desserializa a técnica avançada (JSON) de volta para um Map. */
    public static Map<String, Object> parseTechnique(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<WorkoutDto> getAll(String userId) {
        return repository.findAllByUserId(userId).stream()
                .map(WorkoutDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkoutDto getById(String id, String userId) {
        WorkoutEntity entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Treino não encontrado: " + id));
        return WorkoutDto.from(entity);
    }

    @Transactional
    public WorkoutDto create(String userId, WorkoutRequest request) {
        WorkoutEntity entity = new WorkoutEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setUserId(userId);
        entity.setName(request.name().trim());
        Instant now = Instant.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setExercises(mapPlans(request, entity));
        return WorkoutDto.from(repository.save(entity));
    }

    @Transactional
    public WorkoutDto update(String id, String userId, WorkoutRequest request) {
        WorkoutEntity entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Treino não encontrado: " + id));
        entity.setName(request.name().trim());
        entity.setUpdatedAt(Instant.now());
        entity.getExercises().clear();
        entity.getExercises().addAll(mapPlans(request, entity));
        return WorkoutDto.from(repository.save(entity));
    }

    @Transactional
    public void delete(String id, String userId) {
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new NotFoundException("Treino não encontrado: " + id);
        }
        repository.deleteById(id);
    }

    private List<WorkoutExercisePlanEntity> mapPlans(WorkoutRequest request, WorkoutEntity workout) {
        List<WorkoutExercisePlanEntity> plans = new ArrayList<>();
        for (WorkoutRequest.WorkoutExercisePlanDtoIn in : request.exercises()) {
            WorkoutExercisePlanEntity plan = new WorkoutExercisePlanEntity();
            plan.setId(in.id() != null ? in.id() : UUID.randomUUID().toString());
            plan.setWorkout(workout);
            plan.setExerciseId(in.exerciseId());
            plan.setExerciseOrder(in.order());
            plan.setPlannedSets(in.plannedSets());
            plan.setPlannedReps(in.plannedReps());
            plan.setInitialWeight(in.initialWeight());
            plan.setWarmupSets(in.warmupSets());
            plan.setPreparationSets(in.preparationSets());
            plan.setWorkingSets(in.workingSets());
            plan.setAdvancedTechnique(serializeTechnique(in.advancedTechnique()));
            plans.add(plan);
        }
        return plans;
    }
}

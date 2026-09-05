package com.fittreino.service;

import com.fittreino.config.NotFoundException;
import com.fittreino.dto.request.WorkoutLogRequest;
import com.fittreino.dto.response.AdvancedTechniqueBlockDto;
import com.fittreino.dto.response.WorkoutLogDto;
import com.fittreino.model.SetType;
import com.fittreino.model.WorkoutLogEntity;
import com.fittreino.model.WorkoutLogExerciseEntity;
import com.fittreino.model.WorkoutSetEntity;
import com.fittreino.repository.WorkoutLogRepository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class WorkoutLogService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final WorkoutLogRepository repository;
    private final CompetitionScoreService competitionScoreService;

    public WorkoutLogService(WorkoutLogRepository repository, CompetitionScoreService competitionScoreService) {
        this.repository = repository;
        this.competitionScoreService = competitionScoreService;
    }

    /** Serializa os blocos da técnica (List<Map>) para JSON para persistência em texto. */
    public static String serializeBlocks(List<WorkoutLogRequest.AdvancedTechniqueBlockIn> blocks) {
        if (blocks == null) return null;
        try {
            return MAPPER.writeValueAsString(blocks);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    /** Desserializa os blocos (JSON) de volta para a lista de DTOs. */
    public static List<AdvancedTechniqueBlockDto> parseBlocks(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readValue(json, new TypeReference<List<AdvancedTechniqueBlockDto>>() {});
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<WorkoutLogDto> getAll(String userId) {
        return repository.findAllByUserIdOrderByStartedAtDesc(userId).stream()
                .map(WorkoutLogDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkoutLogDto getById(String id, String userId) {
        WorkoutLogEntity entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Treino realizado não encontrado: " + id));
        return WorkoutLogDto.from(entity);
    }

    /**
     * Sequência ("Chama") de dias consecutivos com pelo menos um treino concluído.
     * Conta a partir de hoje (ou ontem) e permite múltiplos treinos no mesmo dia.
     */
    @Transactional(readOnly = true)
    public int getStreak(String userId) {
        List<Instant> startedDates = repository.findAllByUserIdOrderByStartedAtDesc(userId).stream()
                .map(WorkoutLogEntity::getStartedAt)
                .toList();
        if (startedDates.isEmpty()) return 0;

        var days = startedDates.stream()
                .map(i -> i.atZone(java.time.ZoneId.systemDefault()).toLocalDate())
                .collect(java.util.stream.Collectors.toSet());

        java.time.LocalDate today = java.time.LocalDate.now();
        int streak = 0;
        java.time.LocalDate cursor = today;

        // A sequência não quebra se o último treino foi ontem.
        if (!days.contains(today) && days.contains(today.minusDays(1))) {
            cursor = today.minusDays(1);
        } else if (!days.contains(today)) {
            return 0;
        }

        while (days.contains(cursor)) {
            streak += 1;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    @Transactional
    public WorkoutLogDto create(String userId, WorkoutLogRequest request) {
        WorkoutLogEntity entity = new WorkoutLogEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setUserId(userId);
        entity.setWorkoutId(request.workoutId());
        entity.setWorkoutName(request.workoutName() != null ? request.workoutName() : "Treino");
        entity.setStartedAt(parse(request.startedAt(), Instant.now().minusSeconds(60)));
        entity.setFinishedAt(parse(request.finishedAt(), Instant.now()));

        long duration = java.time.Duration.between(entity.getStartedAt(), entity.getFinishedAt()).getSeconds();
        entity.setDurationSeconds(Math.max(1, duration));

        entity.setExercises(mapExercises(request.exercises(), entity));
        entity.setTotalVolume(computeVolume(entity.getExercises()));
        WorkoutLogEntity saved = repository.save(entity);
        competitionScoreService.onWorkoutLogCreated(userId);
        return WorkoutLogDto.from(saved);
    }

    private List<WorkoutLogExerciseEntity> mapExercises(
            List<WorkoutLogRequest.WorkoutLogExerciseIn> inputs, WorkoutLogEntity log) {
        List<WorkoutLogExerciseEntity> list = new ArrayList<>();
        if (inputs == null) return list;
        int idx = 0;
        for (WorkoutLogRequest.WorkoutLogExerciseIn in : inputs) {
            WorkoutLogExerciseEntity ex = new WorkoutLogExerciseEntity();
            ex.setId(UUID.randomUUID().toString());
            ex.setLog(log);
            ex.setExerciseId(in.exerciseId());
            ex.setExerciseName(in.exerciseName());
            ex.setMuscleGroup(in.muscleGroup());
            ex.setExerciseOrder(in.order() > 0 ? in.order() : idx + 1);
            ex.setPlannedSets(in.plannedSets());
            ex.setPlannedReps(in.plannedReps());
            ex.setDone(in.done());
            ex.setNotes(in.notes());
            ex.setBlocks(serializeBlocks(in.blocks()));
            ex.setSets(mapSets(in.sets(), ex));
            list.add(ex);
            idx++;
        }
        return list;
    }

    private List<WorkoutSetEntity> mapSets(List<WorkoutLogRequest.WorkoutSetIn> inputs,
                                           WorkoutLogExerciseEntity exercise) {
        List<WorkoutSetEntity> list = new ArrayList<>();
        if (inputs == null) return list;
        for (WorkoutLogRequest.WorkoutSetIn in : inputs) {
            WorkoutSetEntity set = new WorkoutSetEntity();
            set.setId(in.id() != null ? in.id() : UUID.randomUUID().toString());
            set.setExercise(exercise);
            set.setSetNumber(in.setNumber());
            set.setWeight(in.weight());
            set.setReps(in.reps());
            set.setDone(in.done());
            set.setType(SetType.fromCode(in.type()).getCode());
            list.add(set);
        }
        return list;
    }

    private double computeVolume(List<WorkoutLogExerciseEntity> exercises) {
        double volume = 0;
        for (WorkoutLogExerciseEntity ex : exercises) {
            for (WorkoutSetEntity set : ex.getSets()) {
                if (set.isDone()) {
                    volume += set.getWeight() * set.getReps();
                }
            }
        }
        return volume;
    }

    private Instant parse(String value, Instant fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return Instant.parse(value);
        } catch (Exception e) {
            try {
                return ZonedDateTime.parse(value).toInstant();
            } catch (Exception ex) {
                return fallback;
            }
        }
    }
}

package com.fittreino.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fittreino.model.CatalogExercise;
import com.fittreino.model.ExerciseEntity;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ExerciseSeeder implements CommandLineRunner {
    private final ExerciseRepository repository;
    private final ObjectMapper mapper;

    public ExerciseSeeder(ExerciseRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        var existing = repository.findAll();
        try (var input = new ClassPathResource("exercise-catalog.json").getInputStream()) {
            for (var entry : mapper.readValue(input, CatalogExercise[].class)) {
                // Preserve IDs already referenced by workouts; never adopt a user's custom record.
                var matches = existing.stream().filter(e -> !e.isCustom() && e.getUserId() == null
                        && (e.getName().equalsIgnoreCase(entry.legacyName())
                        || e.getName().equalsIgnoreCase(entry.name()))).toList();
                if (matches.isEmpty()) {
                    var entity = new ExerciseEntity();
                    entity.setId(UUID.randomUUID().toString());
                    entity.setCreatedAt(Instant.now());
                    matches = Arrays.asList(entity);
                }
                for (var entity : matches) {
                    entity.setName(entry.name());
                    entity.setMuscleGroup(entry.muscleGroup());
                    entity.setCatalogData(mapper.writeValueAsString(entry));
                    repository.save(entity);
                }
            }
        }
    }
}

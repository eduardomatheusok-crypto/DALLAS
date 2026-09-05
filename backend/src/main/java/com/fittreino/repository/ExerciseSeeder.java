package com.fittreino.repository;

import com.fittreino.model.ExerciseEntity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
@Component
public class ExerciseSeeder implements CommandLineRunner {

    private static final List<String[]> DEFAULTS = List.of(
            new String[]{"Supino reto", "Peito"},
            new String[]{"Supino inclinado", "Peito"},
            new String[]{"Crucifixo", "Peito"},
            new String[]{"Puxada frontal", "Costas"},
            new String[]{"Remada", "Costas"},
            new String[]{"Agachamento", "Pernas"},
            new String[]{"Leg Press", "Pernas"},
            new String[]{"Desenvolvimento", "Ombros"},
            new String[]{"Elevação lateral", "Ombros"},
            new String[]{"Rosca direta", "Bíceps"},
            new String[]{"Tríceps pulley", "Tríceps"},
            new String[]{"Abdômen", "Abdômen"},
            new String[]{"Stiff", "Glúteos"},
            new String[]{"Panturrilha em pé", "Panturrilha"}
    );

    private final ExerciseRepository repository;

    public ExerciseSeeder(ExerciseRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }
        for (String[] def : DEFAULTS) {
            ExerciseEntity entity = new ExerciseEntity();
            entity.setId(UUID.randomUUID().toString());
            entity.setName(def[0]);
            entity.setMuscleGroup(def[1]);
            entity.setCustom(false);
            entity.setCreatedAt(Instant.now());
            repository.save(entity);
        }
    }
}

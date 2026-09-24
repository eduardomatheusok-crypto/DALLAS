package com.fittreino.repository;

import com.fittreino.model.ExerciseEntity;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ExerciseSeeder implements CommandLineRunner {

    private static final List<String[]> DEFAULTS = List.of(
            // Peito
            new String[]{"Supino Reto", "Peito"},
            new String[]{"Supino Inclinado com Halteres", "Peito"},
            new String[]{"Crucifixo com Halteres", "Peito"},
            new String[]{"Crossover na Polia Média", "Peito"},
            new String[]{"Voador / Peck Deck", "Peito"},
            new String[]{"Flexão de Braço", "Peito"},

            // Costas
            new String[]{"Puxada Frontal (Pulley)", "Costas"},
            new String[]{"Remada Curvada com Barra", "Costas"},
            new String[]{"Remada Baixa no Triângulo", "Costas"},
            new String[]{"Remada Unilateral (Serrote)", "Costas"},
            new String[]{"Barra Fixa (Pronada)", "Costas"},
            new String[]{"Pulldown com Corda na Polia", "Costas"},
            new String[]{"Levantamento Terra", "Costas"},

            // Ombros
            new String[]{"Desenvolvimento com Halteres", "Ombros"},
            new String[]{"Elevação Lateral com Halteres", "Ombros"},
            new String[]{"Elevação Lateral na Polia", "Ombros"},
            new String[]{"Elevação Frontal com Halteres", "Ombros"},
            new String[]{"Crucifixo Invertido (Deltoide Posterior)", "Ombros"},
            new String[]{"Encolhimento com Halteres", "Ombros"},

            // Bíceps
            new String[]{"Rosca Direta com Barra W", "Bíceps"},
            new String[]{"Rosca Alternada com Halteres", "Bíceps"},
            new String[]{"Rosca Martelo", "Bíceps"},
            new String[]{"Rosca Scott com Barra", "Bíceps"},
            new String[]{"Rosca no Banco Inclinado", "Bíceps"},

            // Tríceps
            new String[]{"Tríceps Pulley com Corda", "Tríceps"},
            new String[]{"Tríceps Pulley com Barra Reta", "Tríceps"},
            new String[]{"Tríceps Testa com Barra W", "Tríceps"},
            new String[]{"Tríceps Francês com Halter", "Tríceps"},
            new String[]{"Mergulho nas Paralelas / Banco", "Tríceps"},

            // Pernas
            new String[]{"Agachamento Livre com Barra", "Pernas"},
            new String[]{"Leg Press 45°", "Pernas"},
            new String[]{"Cadeira Extensora", "Pernas"},
            new String[]{"Mesa Flexora", "Pernas"},
            new String[]{"Cadeira Flexora", "Pernas"},
            new String[]{"Agachamento Búlgaro", "Pernas"},
            new String[]{"Afundo / Passada com Halteres", "Pernas"},
            new String[]{"Agachamento Hack", "Pernas"},

            // Glúteos
            new String[]{"Elevação Pélvica com Barra", "Glúteos"},
            new String[]{"Stiff com Halteres / Barra", "Glúteos"},
            new String[]{"Cadeira Abdutora", "Glúteos"},

            // Panturrilha
            new String[]{"Panturrilha em Pé na Máquina", "Panturrilha"},
            new String[]{"Panturrilha Sentado (Gêmeos)", "Panturrilha"},
            new String[]{"Panturrilha no Leg Press", "Panturrilha"},

            // Abdômen
            new String[]{"Abdominal Crunch no Solo", "Abdômen"},
            new String[]{"Abdominal Infra na Paralela / Barra", "Abdômen"},
            new String[]{"Prancha Abdominal", "Abdômen"},
            new String[]{"Abdominal na Máquina (Crunch)", "Abdômen"},

            // Antebraço
            new String[]{"Rosca Inversa com Barra", "Antebraço"},
            new String[]{"Rosca Punho", "Antebraço"}
    );

    private final ExerciseRepository repository;

    public ExerciseSeeder(ExerciseRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<ExerciseEntity> existing = repository.findAll();
        Set<String> existingNames = existing.stream()
                .map(e -> e.getName().trim().toLowerCase())
                .collect(Collectors.toSet());

        for (String[] def : DEFAULTS) {
            if (!existingNames.contains(def[0].trim().toLowerCase())) {
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
}

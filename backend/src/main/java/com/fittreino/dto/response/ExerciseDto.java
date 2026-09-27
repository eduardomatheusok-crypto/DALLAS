package com.fittreino.dto.response;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fittreino.model.CatalogExercise;
import com.fittreino.model.ExerciseEntity;
import java.time.Instant;
import java.util.List;

public record ExerciseDto(String id, String name, String muscleGroup, boolean custom, Instant createdAt,
        String sourceId, String equipment, List<String> secondaryMuscles, String startImage,
        String endImage, List<String> instructions, String dallasTip) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static ExerciseDto from(ExerciseEntity e) {
        CatalogExercise c = null;
        if (e.getCatalogData() != null) {
            try { c = MAPPER.readValue(e.getCatalogData(), CatalogExercise.class); }
            catch (Exception ex) { throw new IllegalStateException("Invalid exercise catalog data", ex); }
        }
        return new ExerciseDto(e.getId(), e.getName(), e.getMuscleGroup(), e.isCustom(), e.getCreatedAt(),
                c == null ? null : c.sourceId(), c == null ? null : c.equipment(),
                c == null ? null : c.secondaryMuscles(), c == null ? null : c.startImage(),
                c == null ? null : c.endImage(), c == null ? null : c.instructions(),
                c == null ? null : c.dallasTip());
    }
}

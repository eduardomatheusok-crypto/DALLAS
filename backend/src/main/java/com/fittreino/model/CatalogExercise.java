package com.fittreino.model;

import java.util.List;

/** Snapshot of the existing free-exercise-db catalog, served by our exercise API. */
public record CatalogExercise(String sourceId, String legacyName, String name, String muscleGroup,
        String equipment, List<String> secondaryMuscles, String startImage, String endImage,
        List<String> instructions, String dallasTip) {}

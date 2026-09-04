package com.fittreino.workout;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "workout_exercise_plans")
public class WorkoutExercisePlanEntity {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id", nullable = false)
    private WorkoutEntity workout;

    @Column(nullable = false)
    private String exerciseId;

    @Column(nullable = false)
    private int exerciseOrder;

    @Column(nullable = false)
    private int plannedSets;

    @Column(nullable = false)
    private int plannedReps;

    private Double initialWeight;

    /** Séries de aquecimento (nullable para compatibilidade retroativa). */
    private Integer warmupSets;

    /** Séries preparatórias (nullable para compatibilidade). */
    private Integer preparationSets;

    /** Séries válidas explícitas (nullable; usa plannedSets quando ausente). */
    private Integer workingSets;

    /** Técnica avançada serializada como JSON (extensível). */
    @Lob
    @Column(columnDefinition = "text")
    private String advancedTechnique;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public WorkoutEntity getWorkout() { return workout; }
    public void setWorkout(WorkoutEntity workout) { this.workout = workout; }

    public String getExerciseId() { return exerciseId; }
    public void setExerciseId(String exerciseId) { this.exerciseId = exerciseId; }

    public int getExerciseOrder() { return exerciseOrder; }
    public void setExerciseOrder(int exerciseOrder) { this.exerciseOrder = exerciseOrder; }

    public int getPlannedSets() { return plannedSets; }
    public void setPlannedSets(int plannedSets) { this.plannedSets = plannedSets; }

    public int getPlannedReps() { return plannedReps; }
    public void setPlannedReps(int plannedReps) { this.plannedReps = plannedReps; }

    public Double getInitialWeight() { return initialWeight; }
    public void setInitialWeight(Double initialWeight) { this.initialWeight = initialWeight; }

    public Integer getWarmupSets() { return warmupSets; }
    public void setWarmupSets(Integer warmupSets) { this.warmupSets = warmupSets; }

    public Integer getPreparationSets() { return preparationSets; }
    public void setPreparationSets(Integer preparationSets) { this.preparationSets = preparationSets; }

    public Integer getWorkingSets() { return workingSets; }
    public void setWorkingSets(Integer workingSets) { this.workingSets = workingSets; }

    public String getAdvancedTechnique() { return advancedTechnique; }
    public void setAdvancedTechnique(String advancedTechnique) { this.advancedTechnique = advancedTechnique; }
}

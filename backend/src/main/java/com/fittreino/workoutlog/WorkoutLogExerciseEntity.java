package com.fittreino.workoutlog;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_log_exercises")
public class WorkoutLogExerciseEntity {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "log_id", nullable = false)
    private WorkoutLogEntity log;

    @Column(nullable = false)
    private String exerciseId;

    @Column(nullable = false)
    private String exerciseName;

    @Column(nullable = false)
    private String muscleGroup;

    @Column(nullable = false)
    private int exerciseOrder;

    @Column(nullable = false)
    private int plannedSets;

    @Column(nullable = false)
    private int plannedReps;

    @Column(nullable = false)
    private boolean done;

    @Column(length = 500)
    private String notes;

    /** Blocos da técnica avançada executada, serializados como JSON. */
    @Column(length = 1000)
    private String blocks;

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("setNumber ASC")
    private List<WorkoutSetEntity> sets = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public WorkoutLogEntity getLog() { return log; }
    public void setLog(WorkoutLogEntity log) { this.log = log; }

    public String getExerciseId() { return exerciseId; }
    public void setExerciseId(String exerciseId) { this.exerciseId = exerciseId; }

    public String getExerciseName() { return exerciseName; }
    public void setExerciseName(String exerciseName) { this.exerciseName = exerciseName; }

    public String getMuscleGroup() { return muscleGroup; }
    public void setMuscleGroup(String muscleGroup) { this.muscleGroup = muscleGroup; }

    public int getExerciseOrder() { return exerciseOrder; }
    public void setExerciseOrder(int exerciseOrder) { this.exerciseOrder = exerciseOrder; }

    public int getPlannedSets() { return plannedSets; }
    public void setPlannedSets(int plannedSets) { this.plannedSets = plannedSets; }

    public int getPlannedReps() { return plannedReps; }
    public void setPlannedReps(int plannedReps) { this.plannedReps = plannedReps; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getBlocks() { return blocks; }
    public void setBlocks(String blocks) { this.blocks = blocks; }

    public List<WorkoutSetEntity> getSets() { return sets; }
    public void setSets(List<WorkoutSetEntity> sets) { this.sets = sets; }
}

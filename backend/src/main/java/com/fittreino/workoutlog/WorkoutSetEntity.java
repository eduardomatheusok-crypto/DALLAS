package com.fittreino.workoutlog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "workout_sets")
public class WorkoutSetEntity {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "log_exercise_id", nullable = false)
    private WorkoutLogExerciseEntity exercise;

    @Column(nullable = false)
    private int setNumber;

    @Column(nullable = false)
    private double weight;

    @Column(nullable = false)
    private int reps;

    @Column(nullable = false)
    private boolean done;

    @Column(nullable = false, length = 32)
    private String type = SetType.NORMAL.getCode();

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public WorkoutLogExerciseEntity getExercise() { return exercise; }
    public void setExercise(WorkoutLogExerciseEntity exercise) { this.exercise = exercise; }

    public int getSetNumber() { return setNumber; }
    public void setSetNumber(int setNumber) { this.setNumber = setNumber; }

    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }

    public int getReps() { return reps; }
    public void setReps(int reps) { this.reps = reps; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }
}
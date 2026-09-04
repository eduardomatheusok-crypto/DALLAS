package com.fittreino.workoutlog;

public record WorkoutSetDto(
        String id,
        int setNumber,
        double weight,
        int reps,
        boolean done,
        String type
) {
    public static WorkoutSetDto from(WorkoutSetEntity e) {
        return new WorkoutSetDto(
                e.getId(),
                e.getSetNumber(),
                e.getWeight(),
                e.getReps(),
                e.isDone(),
                SetType.fromCode(e.getType()).getCode()
        );
    }
}

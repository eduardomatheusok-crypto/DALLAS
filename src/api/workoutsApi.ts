import { apiDelete, apiGet, apiPost, apiPut, isApiOnline } from './client';
import { workoutFromDto, type WorkoutDto } from './dto';
import type { Workout, WorkoutExercisePlan } from '../models';

function workoutExercisePlanToDto(e: WorkoutExercisePlan) {
  return {
    exerciseId: e.exerciseId,
    order: e.order,
    plannedSets: e.plannedSets,
    plannedReps: e.plannedReps,
    initialWeight: e.initialWeight,
    warmupSets: e.warmupSets,
    preparationSets: e.preparationSets,
    workingSets: e.workingSets,
    advancedTechnique: e.advancedTechnique,
  };
}

export interface WorkoutsApi {
  getAll(): Promise<Workout[]>;
  getById(id: string): Promise<Workout | undefined>;
  create(name: string, exercises: WorkoutExercisePlan[]): Promise<Workout>;
  update(id: string, name: string, exercises: WorkoutExercisePlan[]): Promise<Workout>;
  remove(id: string): Promise<void>;
  enabled(): boolean;
}

export const workoutsApi: WorkoutsApi = {
  enabled() {
    return isApiOnline();
  },
  async getAll() {
    const list = await apiGet<WorkoutDto[]>('/api/workouts');
    return list.map(workoutFromDto);
  },
  async getById(id) {
    const dto = await apiGet<WorkoutDto>(`/api/workouts/${id}`);
    return workoutFromDto(dto);
  },
  async create(name, exercises) {
    const dto = await apiPost<WorkoutDto>('/api/workouts', {
      name, exercises: exercises.map((e) => workoutExercisePlanToDto(e)),
    });
    return workoutFromDto(dto);
  },
  async update(id, name, exercises) {
    const dto = await apiPut<WorkoutDto>(`/api/workouts/${id}`, {
      name, exercises: exercises.map((e) => workoutExercisePlanToDto(e)),
    });
    return workoutFromDto(dto);
  },
  async remove(id) {
    await apiDelete(`/api/workouts/${id}`);
  },
};

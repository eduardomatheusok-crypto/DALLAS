import { apiGet, apiPost, isApiOnline } from './client';
import { exerciseFromDto, exerciseToDto, type ExerciseDto } from './dto';
import type { Exercise, MuscleGroup } from '../models';

export interface ExercisesApi {
  getAll(query?: string, muscleGroup?: string): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | undefined>;
  create(name: string, muscleGroup: MuscleGroup): Promise<Exercise>;
  enabled(): boolean;
}

export const exercisesApi: ExercisesApi = {
  enabled() {
    return isApiOnline();
  },
  async getAll(query = '', muscleGroup) {
    const params: Record<string, string> = {};
    if (query.trim()) params.query = query.trim();
    if (muscleGroup) params.muscleGroup = muscleGroup;
    const list = await apiGet<ExerciseDto[]>('/api/exercises', params);
    return list.map(exerciseFromDto);
  },
  async getById(id) {
    const dto = await apiGet<ExerciseDto>(`/api/exercises/${id}`);
    return exerciseFromDto(dto);
  },
  async create(name, muscleGroup) {
    const dto = await apiPost<ExerciseDto>('/api/exercises', { name, muscleGroup });
    return exerciseFromDto(dto);
  },
};

import { apiGet, apiPost, isApiOnline } from './client';
import { logFromDto, logToDto, type WorkoutLogDto } from './dto';
import type { WorkoutLog } from '../models';

export interface LogsApi {
  getAll(): Promise<WorkoutLog[]>;
  getById(id: string): Promise<WorkoutLog | undefined>;
  create(log: WorkoutLog): Promise<WorkoutLog>;
  getStreak(): Promise<number>;
  enabled(): boolean;
}

export const logsApi: LogsApi = {
  enabled() {
    return isApiOnline();
  },
  async getAll() {
    const list = await apiGet<WorkoutLogDto[]>('/api/workout-logs');
    return list.map(logFromDto);
  },
  async getById(id) {
    const dto = await apiGet<WorkoutLogDto>(`/api/workout-logs/${id}`);
    return logFromDto(dto);
  },
  async create(log) {
    const dto = await apiPost<WorkoutLogDto>('/api/workout-logs', logToDto(log));
    return logFromDto(dto);
  },
  async getStreak() {
    return apiGet<number>('/api/workout-logs/streak');
  },
};

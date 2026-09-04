import { storage } from '../storage';
import type {
  WorkoutLog,
  WorkoutLogExercise,
  WorkoutSet,
} from '../models';
import { isWorkingSet } from '../models';
import { logsApi } from '../api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

function computeVolume(sets: WorkoutSet[]): number {
  return sets
    .filter((s) => s.completed && isWorkingSet(s))
    .reduce((acc, s) => acc + s.weight * s.reps, 0);
}

export class WorkoutLogService {
  async getAll(): Promise<WorkoutLog[]> {
    if (logsApi.enabled()) {
      try {
        const remote = await logsApi.getAll();
        await storage.setLogs(remote);
        return remote;
      } catch {
        // segue para local
      }
    }
    const local = await storage.getLogs();
    return [...local].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }

  async saveLog(log: WorkoutLog): Promise<WorkoutLog> {
    if (logsApi.enabled()) {
      try {
        const saved = await logsApi.create(log);
        await this.upsertLocal(saved);
        return saved;
      } catch {
        // segue para local
      }
    }
    const list = await storage.getLogs();
    const index = list.findIndex((l) => l.id === log.id);
    if (index === -1) {
      list.push(log);
    } else {
      list[index] = log;
    }
    await storage.setLogs(list);
    return log;
  }

  async getRecent(limit: number): Promise<WorkoutLog[]> {
    const list = await this.getAll();
    return list.slice(0, limit);
  }

  async getLastByExercise(exerciseId: string): Promise<
    | { weight: number; reps: number }[]
    | undefined
  > {
    const list = await this.getAll();
    for (const log of list) {
      const target = log.exercises.find((e) => e.exerciseId === exerciseId);
      const working = (target?.sets ?? []).filter(
        (s) => s.completed && isWorkingSet(s),
      );
      if (working.length > 0) {
        return working.map((s) => ({ weight: s.weight, reps: s.reps }));
      }
    }
    return undefined;
  }

  async getHistoryByExercise(
    exerciseId: string,
  ): Promise<{ date: string; maxWeight: number; maxReps: number; volume: number }[]> {
    const list = await this.getAll();
    const result: { date: string; maxWeight: number; maxReps: number; volume: number }[] = [];
    for (const log of list) {
      const target = log.exercises.find((e) => e.exerciseId === exerciseId);
      const working = (target?.sets ?? []).filter(
        (s) => s.completed && isWorkingSet(s),
      );
      if (working.length === 0) continue;
      result.push({
        date: log.startedAt,
        maxWeight: Math.max(...working.map((s) => s.weight)),
        maxReps: Math.max(...working.map((s) => s.reps)),
        volume: computeVolume(working),
      });
    }
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /** Sequência (Chama) de dias consecutivos com treino concluído. Usa a API quando online. */
  async getStreak(): Promise<number> {
    if (logsApi.enabled()) {
      try {
        return await logsApi.getStreak();
      } catch {
        // segue para derivação local
      }
    }
    const list = await this.getAll();
    return computeStreakFromLogs(list);
  }

  private async upsertLocal(saved: WorkoutLog): Promise<void> {
    const list = await storage.getLogs();
    const idx = list.findIndex((l) => l.id === saved.id);
    if (idx === -1) {
      await storage.setLogs([...list, saved]);
    } else {
      list[idx] = saved;
      await storage.setLogs(list);
    }
  }

  async invalidate(): Promise<void> {
    // sem cache
  }

  static newSet(setNumber: number): WorkoutSet {
    return {
      id: uuidv4(),
      setNumber,
      weight: 0,
      reps: 0,
      completed: false,
      type: 'normal',
    };
  }
}

export const workoutLogService = new WorkoutLogService();

/** Deriva a sequência (Chama) de dias consecutivos a partir do histórico de logs. */
export function computeStreakFromLogs(logs: Pick<WorkoutLog, 'startedAt'>[]): number {
  if (logs.length === 0) return 0;
  const days = Array.from(
    new Set(logs.map((l) => new Date(l.startedAt).toDateString())),
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const day of days) {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    if (streak === 0 && d.getTime() < cursor.getTime() - 86400000) {
      break;
    }
    if (d.getTime() >= cursor.getTime() - 86400000) {
      streak += 1;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

export interface WorkoutLogExercisePayload {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  plannedSets: number;
  plannedReps: number;
  sets: WorkoutSet[];
  completed: boolean;
}

export function buildLog(overrides: {
  workoutId: string;
  workoutName: string;
  startedAt: string;
  finishedAt: string;
  exercises: WorkoutLogExercise[];
}): WorkoutLog {
  const durationSeconds = Math.max(
    1,
    Math.floor((new Date(overrides.finishedAt).getTime() - new Date(overrides.startedAt).getTime()) / 1000),
  );
  const totalVolume = overrides.exercises.reduce(
    (acc, e) => acc + computeVolume(e.sets),
    0,
  );
  return {
    id: uuidv4(),
    workoutId: overrides.workoutId,
    workoutName: overrides.workoutName,
    startedAt: overrides.startedAt,
    finishedAt: overrides.finishedAt,
    durationSeconds,
    exercises: overrides.exercises,
    totalVolume,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 1) return `${seconds}s`;
  const hours = Math.floor(mins / 60);
  if (hours > 0) {
    return `${hours}h ${mins % 60}min`;
  }
  return `${mins}min`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

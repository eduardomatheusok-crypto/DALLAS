import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Exercise, Workout, WorkoutLog } from '../models';

const KEYS = {
  user: '@treino/user',
  token: '@treino/token',
  deviceId: '@treino/deviceId',
  exercises: '@treino/exercises',
  workouts: '@treino/workouts',
  logs: '@treino/logs',
} as const;

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to read storage key ${key}`, err);
    return fallback;
  }
}

async function write<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write storage key ${key}`, err);
  }
}

export const storage = {
  async getUser(): Promise<User | null> {
    return read<User | null>(KEYS.user, null);
  },
  async setUser(user: User | null): Promise<void> {
    return write(KEYS.user, user);
  },
  async getToken(): Promise<string | null> {
    return read<string | null>(KEYS.token, null);
  },
  async setToken(token: string | null): Promise<void> {
    return write(KEYS.token, token);
  },
  async getDeviceId(): Promise<string | null> {
    return read<string | null>(KEYS.deviceId, null);
  },
  async setDeviceId(id: string): Promise<void> {
    return write(KEYS.deviceId, id);
  },
  async getExercises(): Promise<Exercise[]> {
    return read<Exercise[]>(KEYS.exercises, []);
  },
  async setExercises(exercises: Exercise[]): Promise<void> {
    return write(KEYS.exercises, exercises);
  },
  async getWorkouts(): Promise<Workout[]> {
    return read<Workout[]>(KEYS.workouts, []);
  },
  async setWorkouts(workouts: Workout[]): Promise<void> {
    return write(KEYS.workouts, workouts);
  },
  async getLogs(): Promise<WorkoutLog[]> {
    return read<WorkoutLog[]>(KEYS.logs, []);
  },
  async setLogs(logs: WorkoutLog[]): Promise<void> {
    return write(KEYS.logs, logs);
  },
  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};

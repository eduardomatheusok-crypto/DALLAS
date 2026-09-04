import { storage } from '../storage';
import type { Workout, WorkoutExercisePlan } from '../models';
import type { AdvancedTechnique } from '../models';
import { workoutsApi } from '../api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export class WorkoutService {
  async getAll(): Promise<Workout[]> {
    if (workoutsApi.enabled()) {
      try {
        const remote = await workoutsApi.getAll();
        await storage.setWorkouts(remote);
        return remote;
      } catch {
        // segue para local
      }
    }
    const local = await storage.getWorkouts();
    return [...local].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async getById(id: string): Promise<Workout | undefined> {
    if (workoutsApi.enabled()) {
      try {
        const remote = await workoutsApi.getById(id);
        if (remote) return remote;
      } catch {
        // segue
      }
    }
    const list = await storage.getWorkouts();
    return list.find((w) => w.id === id);
  }

  async saveWorkout(name: string, exercises: WorkoutExercisePlan[], id?: string): Promise<Workout> {
    if (workoutsApi.enabled()) {
      try {
        const saved = id
          ? await workoutsApi.update(id, name, exercises)
          : await workoutsApi.create(name, exercises);
        await this.upsertLocal(saved);
        return saved;
      } catch {
        // segue para local
      }
    }
    const now = new Date().toISOString();
    let workout: Workout;
    const list = await storage.getWorkouts();
    if (id) {
      const index = list.findIndex((w) => w.id === id);
      if (index === -1) throw new Error('Treino não encontrado');
      workout = { ...list[index], name: name.trim(), exercises, updatedAt: now };
      list[index] = workout;
    } else {
      workout = {
        id: uuidv4(),
        name: name.trim(),
        exercises,
        createdAt: now,
        updatedAt: now,
      };
      list.push(workout);
    }
    await storage.setWorkouts(list);
    return workout;
  }

  async deleteWorkout(id: string): Promise<void> {
    if (workoutsApi.enabled()) {
      try {
        await workoutsApi.remove(id);
      } catch {
        // segue
      }
    }
    const list = await storage.getWorkouts();
    await storage.setWorkouts(list.filter((w) => w.id !== id));
  }

  /**
   * Duplica um treino com um novo nome. As configurações avançadas são copiadas.
   */
  async duplicateWorkout(id: string): Promise<Workout | undefined> {
    const workout = await this.getById(id);
    if (!workout) return undefined;
    const now = new Date().toISOString();
    const copy: Workout = {
      ...workout,
      id: uuidv4(),
      name: `${workout.name} (cópia)`,
      exercises: workout.exercises.map((e) => ({ ...e, advancedTechnique: e.advancedTechnique ? { ...e.advancedTechnique } : undefined })),
      createdAt: now,
      updatedAt: now,
    };
    const list = await storage.getWorkouts();
    list.push(copy);
    await storage.setWorkouts(list);
    return copy;
  }

  /** Renomeia um treino existente, preservando exercícios e configurações. */
  async renameWorkout(id: string, name: string): Promise<Workout | undefined> {
    const workout = await this.getById(id);
    if (!workout) return undefined;
    return this.saveWorkout(name, workout.exercises, workout.id);
  }

  /**
   * Atualiza a configuração de UM exercício dentro de um treino (séries por
   * categoria e técnica avançada) sem alterar os demais exercícios.
   */
  async updateExerciseConfig(
    workoutId: string,
    exerciseId: string,
    config: {
      warmupSets?: number;
      preparationSets?: number;
      workingSets?: number;
      advancedTechnique?: AdvancedTechnique;
    },
  ): Promise<Workout | undefined> {
    const workout = await this.getById(workoutId);
    if (!workout) return undefined;

    const exercises = workout.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const next: WorkoutExercisePlan = { ...e };
      if (config.warmupSets !== undefined) next.warmupSets = config.warmupSets;
      if (config.preparationSets !== undefined) next.preparationSets = config.preparationSets;
      if (config.workingSets !== undefined) {
        next.workingSets = config.workingSets;
        next.plannedSets = config.workingSets;
      }
      if (config.advancedTechnique !== undefined) {
        if (config.advancedTechnique.kind === 'none') {
          next.advancedTechnique = undefined;
        } else {
          next.advancedTechnique = config.advancedTechnique;
        }
      }
      return next;
    });

    return this.saveWorkout(workout.name, exercises, workout.id);
  }

  private async upsertLocal(saved: Workout): Promise<void> {
    const list = await storage.getWorkouts();
    const idx = list.findIndex((w) => w.id === saved.id);
    if (idx === -1) {
      await storage.setWorkouts([...list, saved]);
    } else {
      list[idx] = saved;
      await storage.setWorkouts(list);
    }
  }

  async invalidate(): Promise<void> {
    // sem cache
  }
}

export const workoutService = new WorkoutService();

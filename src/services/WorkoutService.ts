import { storage } from '../storage';
import type { Workout, WorkoutExercisePlan } from '../models';
import type { AdvancedTechnique } from '../models';
import { workoutsApi } from '../api';
import { prepareExerciseImages } from './ExerciseMediaCache';
import { exerciseService, isCatalogExercise } from './ExerciseService';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export class WorkoutService {
  async saveGeneratedWorkouts(workouts: Workout[]): Promise<void> {
    if (!workouts.length) return;
    const user = await storage.getUser();
    const local = await storage.getWorkouts();
    const byId = new Map(local.map(w => [w.id, w]));
    workouts.forEach(w => { if (!byId.has(w.id)) byId.set(w.id, { ...w, ownerId: user?.id, pendingSync: true }); });
    // One durable write: failures never leave half of an onboarding plan.
    await storage.setWorkouts([...byId.values()]);
    await this.getAll();
  }

  async getAll(): Promise<Workout[]> {
    if (workoutsApi.enabled()) {
      try {
        const user = await storage.getUser();
        for (const pending of (await storage.getWorkouts()).filter(w => w.pendingSync && w.ownerId === user?.id)) {
          const saved = await workoutsApi.create(pending.name, pending.exercises, pending.id);
          await this.upsertLocal(saved);
        }
        const remote = (await workoutsApi.getAll()).map(w => ({ ...w, ownerId: user?.id }));
        const local = await storage.getWorkouts();
        const merged = [...remote, ...local.filter(w => !remote.some(r => r.id === w.id))];
        await storage.setWorkouts(merged);
        return merged.filter(w => !w.ownerId || w.ownerId === user?.id);
      } catch {
        // segue para local
      }
    }
    const local = await storage.getWorkouts();
    const user = await storage.getUser();
    return local.filter(w => !w.ownerId || w.ownerId === user?.id).sort(
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
    const existing = id ? (await storage.getWorkouts()).find(w => w.id === id) : undefined;
    const added = exercises.filter(e => !existing?.exercises.some(old => old.exerciseId === e.exerciseId));
    if (added.length) {
      const catalog = await exerciseService.getCatalog();
      if (added.some(plan => !catalog.some(e => e.id === plan.exerciseId && isCatalogExercise(e)))) {
        throw new Error('Selecione exercícios com imagem no catálogo antes de salvar.');
      }
      await prepareExerciseImages(catalog.filter(e => added.some(plan => plan.exerciseId === e.id)));
    }
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
      restSeconds?: number | null;
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
      if (config.restSeconds !== undefined) {
        next.restSeconds = config.restSeconds ?? undefined;
      }
      return next;
    });

    return this.saveWorkout(workout.name, exercises, workout.id);
  }

  private async upsertLocal(saved: Workout): Promise<void> {
    saved = { ...saved, ownerId: (await storage.getUser())?.id };
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

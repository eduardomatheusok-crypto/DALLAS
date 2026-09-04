import { storage } from '../storage';
import type { Exercise, MuscleGroup } from '../models';
import { exercisesApi } from '../api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_EXERCISES: Omit<Exercise, 'id' | 'createdAt' | 'isCustom'>[] = [
  { name: 'Supino reto', muscleGroup: 'Peito' },
  { name: 'Supino inclinado', muscleGroup: 'Peito' },
  { name: 'Crucifixo', muscleGroup: 'Peito' },
  { name: 'Puxada frontal', muscleGroup: 'Costas' },
  { name: 'Remada', muscleGroup: 'Costas' },
  { name: 'Agachamento', muscleGroup: 'Pernas' },
  { name: 'Leg Press', muscleGroup: 'Pernas' },
  { name: 'Desenvolvimento', muscleGroup: 'Ombros' },
  { name: 'Elevação lateral', muscleGroup: 'Ombros' },
  { name: 'Rosca direta', muscleGroup: 'Bíceps' },
  { name: 'Tríceps pulley', muscleGroup: 'Tríceps' },
  { name: 'Abdômen', muscleGroup: 'Abdômen' },
  { name: 'Stiff', muscleGroup: 'Glúteos' },
  { name: 'Panturrilha em pé', muscleGroup: 'Panturrilha' },
];

function stripDtoFields(e: Exercise): Exercise {
  return {
    id: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    isCustom: e.isCustom,
    createdAt: e.createdAt,
  };
}

export class ExerciseService {
  private async seedIfEmpty(): Promise<void> {
    const list = await storage.getExercises();
    if (list.length > 0) return;
    const seeded = DEFAULT_EXERCISES.map((e) => ({
      ...e,
      id: uuidv4(),
      isCustom: false,
      createdAt: new Date().toISOString(),
    }));
    await storage.setExercises(seeded);
  }

  async getAll(): Promise<Exercise[]> {
    if (exercisesApi.enabled()) {
      try {
        const remote = await exercisesApi.getAll();
        if (remote.length > 0) {
          await storage.setExercises(remote);
          return remote.map(stripDtoFields);
        }
      } catch {
        // segue para local
      }
    }
    await this.seedIfEmpty();
    return (await storage.getExercises()).map(stripDtoFields);
  }

  async getById(id: string): Promise<Exercise | undefined> {
    if (exercisesApi.enabled()) {
      try {
        const remote = await exercisesApi.getById(id);
        if (remote) return stripDtoFields(remote);
      } catch {
        // segue
      }
    }
    const list = await storage.getExercises();
    return list.find((e) => e.id === id);
  }

  async search(query: string): Promise<Exercise[]> {
    const filtered = await this.getAll();
    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((e) => e.name.toLowerCase().includes(q));
  }

  async getByMuscleGroup(group: MuscleGroup): Promise<Exercise[]> {
    const all = await this.getAll();
    return all.filter((e) => e.muscleGroup === group);
  }

  async createCustom(name: string, muscleGroup: MuscleGroup): Promise<Exercise> {
    const local: Exercise = {
      id: uuidv4(),
      name: name.trim(),
      muscleGroup,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    if (exercisesApi.enabled()) {
      try {
        const remote = await exercisesApi.create(name, muscleGroup);
        await this.pushExercise(remote);
        return stripDtoFields(remote);
      } catch {
        // segue para local
      }
    }
    const list = await storage.getExercises();
    await storage.setExercises([...list, local]);
    return local;
  }

  private async pushExercise(exercise: Exercise): Promise<void> {
    const list = await storage.getExercises();
    const filtered = list.filter((e) => e.name !== exercise.name);
    await storage.setExercises([...filtered, stripDtoFields(exercise)]);
  }

  async invalidate(): Promise<void> {
    // caches removidas; nada a fazer
  }
}

export const exerciseService = new ExerciseService();

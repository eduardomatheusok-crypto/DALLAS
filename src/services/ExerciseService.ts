import { storage } from '../storage';
import type { Exercise, MuscleGroup, ExerciseEquipment } from '../models';
import { exercisesApi } from '../api';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { CURATED_EXERCISES } from '../data/curatedExercises';

function stripExerciseFields(e: Exercise): Exercise {
  return {
    id: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipment: e.equipment,
    secondaryMuscles: e.secondaryMuscles,
    startImage: e.startImage,
    endImage: e.endImage,
    gifUrl: e.gifUrl,
    steps: e.steps,
    instructions: e.instructions,
    dallasTip: e.dallasTip,
    isCustom: e.isCustom,
    createdAt: e.createdAt,
  };
}

const LEGACY_ALIASES: Record<string, string> = {
  'supino reto': 'Supino Reto',
  'supino reto com barra': 'Supino Reto',
  'supino inclinado': 'Supino Inclinado com Halteres',
  'supino inclinado com halteres': 'Supino Inclinado com Halteres',
  'crucifixo': 'Crucifixo com Halteres',
  'crucifixo com halteres': 'Crucifixo com Halteres',
  'puxada frontal': 'Puxada Frontal (Pulley)',
  'remada': 'Remada Curvada com Barra',
  'agachamento': 'Agachamento Livre com Barra',
  'leg press': 'Leg Press 45°',
  'desenvolvimento': 'Desenvolvimento com Halteres',
  'elevação lateral': 'Elevação Lateral com Halteres',
  'elevacao lateral': 'Elevação Lateral com Halteres',
  'elevação lateral na polia': 'Elevação Lateral na Polia',
  'elevacao lateral na polia': 'Elevação Lateral na Polia',
  'encolhimento': 'Encolhimento com Halteres',
  'encolhimento com halteres': 'Encolhimento com Halteres',
  'rosca direta': 'Rosca Direta com Barra W',
  'tríceps pulley': 'Tríceps Pulley com Corda',
  'triceps pulley': 'Tríceps Pulley com Corda',
  'abdômen': 'Abdominal Crunch no Solo',
  'abdomen': 'Abdominal Crunch no Solo',
  'stiff': 'Stiff com Halteres / Barra',
  'panturrilha em pé': 'Panturrilha em Pé na Máquina',
  'panturrilha em pe': 'Panturrilha em Pé na Máquina',
};

export function resolveCanonicalName(name: string): string {
  const clean = name.trim().toLowerCase();
  return LEGACY_ALIASES[clean] || name.trim();
}

export function findExerciseByIdOrName(
  exercises: Exercise[],
  id?: string,
  name?: string
): Exercise | undefined {
  if (id) {
    const byId = exercises.find((e) => e.id === id);
    if (byId && (byId.startImage || !name)) return byId;
  }
  if (name) {
    const canonical = resolveCanonicalName(name).toLowerCase().trim();
    const byCanonical = exercises.find(
      (e) => resolveCanonicalName(e.name).toLowerCase().trim() === canonical
    );
    if (byCanonical) return byCanonical;
  }
  return id ? exercises.find((e) => e.id === id) : undefined;
}

function enrichExercises(baseList: Exercise[]): Exercise[] {
  const curatedMap = new Map<string, (typeof CURATED_EXERCISES)[number]>();
  for (const c of CURATED_EXERCISES) {
    curatedMap.set(c.name.toLowerCase().trim(), c);
  }

  const result: Exercise[] = [];
  const handledCanonicalKeys = new Set<string>();

  // 1. Processa e enriquece os exercícios existentes
  for (const ex of baseList) {
    const canonicalName = resolveCanonicalName(ex.name);
    const canonicalKey = canonicalName.toLowerCase().trim();

    // Se já processamos um exercício com esse nome canônico, ignora a duplicata
    if (handledCanonicalKeys.has(canonicalKey)) {
      continue;
    }

    const curated = curatedMap.get(canonicalKey);
    if (curated) {
      handledCanonicalKeys.add(canonicalKey);
      result.push({
        ...ex,
        name: curated.name, // Normaliza o nome para o canônico
        muscleGroup: curated.muscleGroup,
        equipment: curated.equipment,
        secondaryMuscles: curated.secondaryMuscles,
        startImage: curated.startImage,
        endImage: curated.endImage,
        gifUrl: ex.gifUrl,
        steps: ex.steps || curated.steps,
        instructions: curated.instructions,
        dallasTip: curated.dallasTip,
        isCustom: ex.isCustom,
      });
    } else {
      // Exercício personalizado do usuário que não faz parte do catálogo
      handledCanonicalKeys.add(canonicalKey);
      result.push(ex);
    }
  }

  // 2. Inclui todos os exercícios curados que ainda não estão na lista
  for (const [key, curated] of curatedMap.entries()) {
    if (!handledCanonicalKeys.has(key)) {
      handledCanonicalKeys.add(key);
      result.push({
        ...curated,
        id: uuidv4(),
        isCustom: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return result;
}

export class ExerciseService {
  private async seedIfEmpty(): Promise<void> {
    const list = await storage.getExercises();
    
    if (list.length === 0) {
      const seeded: Exercise[] = CURATED_EXERCISES.map((e) => ({
        ...e,
        id: uuidv4(),
        isCustom: false,
        createdAt: new Date().toISOString(),
      }));
      await storage.setExercises(seeded);
      return;
    }

    const enriched = enrichExercises(list);
    await storage.setExercises(enriched);
  }

  async getAll(): Promise<Exercise[]> {
    if (exercisesApi.enabled()) {
      try {
        const remote = await exercisesApi.getAll();
        if (remote.length > 0) {
          const enriched = enrichExercises(remote);
          await storage.setExercises(enriched);
          return enriched.map(stripExerciseFields);
        }
      } catch {
        // segue para local
      }
    }
    await this.seedIfEmpty();
    const local = await storage.getExercises();
    const enriched = enrichExercises(local);
    await storage.setExercises(enriched);
    return enriched.map(stripExerciseFields);
  }

  async getById(id: string): Promise<Exercise | undefined> {
    const all = await this.getAll();
    return all.find((e) => e.id === id);
  }

  async search(query: string): Promise<Exercise[]> {
    const filtered = await this.getAll();
    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.equipment && e.equipment.toLowerCase().includes(q)) ||
        (e.muscleGroup && e.muscleGroup.toLowerCase().includes(q)) ||
        (e.secondaryMuscles && e.secondaryMuscles.some((m) => m.toLowerCase().includes(q)))
    );
  }

  async getByMuscleGroup(group: MuscleGroup): Promise<Exercise[]> {
    const all = await this.getAll();
    return all.filter((e) => e.muscleGroup === group);
  }

  async createCustom(
    name: string,
    muscleGroup: MuscleGroup,
    equipment: ExerciseEquipment = 'Outro',
    dallasTip?: string
  ): Promise<Exercise> {
    const local: Exercise = {
      id: uuidv4(),
      name: name.trim(),
      muscleGroup,
      equipment,
      dallasTip,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    if (exercisesApi.enabled()) {
      try {
        const remote = await exercisesApi.create(name, muscleGroup);
        await this.pushExercise(remote);
        return stripExerciseFields(remote);
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
    await storage.setExercises([...filtered, stripExerciseFields(exercise)]);
  }

  async invalidate(): Promise<void> {
    // caches removidas; nada a fazer
  }
}

export const exerciseService = new ExerciseService();

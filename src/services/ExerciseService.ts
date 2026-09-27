import { storage } from '../storage';
import type { Exercise, MuscleGroup, ExerciseEquipment } from '../models';
import { exercisesApi } from '../api';

import { ensureApiOnline } from '../api/client';

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
  'stiff': 'Stiff com Halteres',
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
    return byId;
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

/** Only catalog records received through the existing API can enter new workouts. */
export function isCatalogExercise(e: Exercise): boolean {
  return e.catalogOrigin === 'api' && !e.isCustom && !!e.id && !!e.name.trim()
    && e.name.trim().toLowerCase() !== 'exercício' && !!(e.startImage || e.gifUrl);
}

export class ExerciseService {
  private pending?: Promise<Exercise[]>;

  async getAll(): Promise<Exercise[]> {
    if (this.pending) return this.pending;
    this.pending = this.load();
    try { return await this.pending; } finally { this.pending = undefined; }
  }

  private async load(): Promise<Exercise[]> {
    const local = await storage.getExercises();
    if (await ensureApiOnline()) {
      try {
        const remote = await exercisesApi.getAll();
        // Keep historical references, but never enrich API records with unrelated media.
        const byId = new Map(local.map(e => [e.id, e]));
        remote.forEach(e => byId.set(e.id, e));
        const merged = [...byId.values()];
        await storage.setExercises(merged);
        return merged;
      } catch { /* Previously fetched catalog remains usable offline. */ }
    }
    return local;
  }

  async getCatalog(): Promise<Exercise[]> {
    return (await this.getAll()).filter(isCatalogExercise);
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
    const existing = (await this.getCatalog()).find(e =>
      resolveCanonicalName(e.name).toLowerCase() === resolveCanonicalName(name).toLowerCase());
    if (existing) return existing;
    throw new Error('Selecione um exercício com imagem no catálogo DALLAS.');
  }

  async invalidate(): Promise<void> {
    // caches removidas; nada a fazer
  }
}

export const exerciseService = new ExerciseService();

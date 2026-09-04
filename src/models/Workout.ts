import type { AdvancedTechnique } from './AdvancedTechnique';
import type { SetCategory } from './WorkoutLog';

export interface WorkoutExercisePlan {
  exerciseId: string;
  order: number;
  plannedSets: number;
  plannedReps: number;
  initialWeight?: number;
  /** Séries de aquecimento. Opcional por compatibilidade retroativa. */
  warmupSets?: number;
  /** Séries preparatórias. Opcional por compatibilidade. */
  preparationSets?: number;
  /** Séries válidas (contabilizadas nas métricas). Quando ausente, usa `plannedSets`. */
  workingSets?: number;
  /** Técnica avançada aplicada ao exercício neste treino. */
  advancedTechnique?: AdvancedTechnique;
}

export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercisePlan[];
  createdAt: string;
  updatedAt: string;
}

/** Quantidade total de séries configuradas para o exercício (todas as categorias). */
export function planTotalSets(plan: WorkoutExercisePlan): number {
  const working = plan.workingSets ?? plan.plannedSets;
  const warmup = plan.warmupSets ?? 0;
  const preparation = plan.preparationSets ?? 0;
  return Math.max(0, working) + Math.max(0, warmup) + Math.max(0, preparation);
}

/** Séries válidas (contabilizadas nas métricas de desempenho). */
export function planWorkingSets(plan: WorkoutExercisePlan): number {
  return Math.max(0, plan.workingSets ?? plan.plannedSets);
}

export function planWarmupSets(plan: WorkoutExercisePlan): number {
  return Math.max(0, plan.warmupSets ?? 0);
}

export function planPreparationSets(plan: WorkoutExercisePlan): number {
  return Math.max(0, plan.preparationSets ?? 0);
}

/**
 * Gera a lista de categorias de série na ordem de execução
 * (aquecimento → preparatórias → válidas), repetindo cada uma `count` vezes.
 */
export function planSetCategories(plan: WorkoutExercisePlan): SetCategory[] {
  const categories: SetCategory[] = [];
  for (let i = 0; i < planWarmupSets(plan); i += 1) categories.push('warmup');
  for (let i = 0; i < planPreparationSets(plan); i += 1) categories.push('preparation');
  for (let i = 0; i < planWorkingSets(plan); i += 1) categories.push('working');
  return categories;
}

import type { WorkoutSet } from '../models';
import { isWorkingSet } from '../models';

export type ProgressionSuggestion =
  | { action: 'progress'; message: string; suggestedWeight?: number }
  | { action: 'maintain'; message: string }
  | { action: 'neutral'; message: string };

/**
 * Sugere progressão de carga com base nas repetições realizadas vs. o alvo.
 *
 * Regra (ex.: usuário define range 6–10 reps):
 * - Se as reps máximas atingem o topo do range (>= alvo): motiva a aumentar carga.
 * - Se chegam perto do topo (alvo - 2): incentiva a buscar o topo.
 * - Caso contrário: mantém a carga e foca em ganhar reps.
 *
 * @param targetReps   Repetições alvo (topo do range) planejadas.
 * @param sets         Séries realizadas.
 * @param incrementStep Passo de aumento sugerido (padrão 2.5 kg).
 */
export function suggestProgression(
  targetReps: number,
  sets: WorkoutSet[],
  incrementStep = 2.5,
): ProgressionSuggestion | null {
  if (targetReps <= 0) return null;
  const done = sets.filter((s) => s.completed && s.reps > 0 && isWorkingSet(s));
  if (done.length === 0) return null;

  const maxWeight = Math.max(...done.map((s) => s.weight));
  const maxReps = Math.max(...done.map((s) => s.reps));

  if (maxReps >= targetReps) {
    return {
      action: 'progress',
      message: `Você bateu ${maxReps} reps (alvo ${targetReps}). Bora aumentar a carga! 💪`,
      suggestedWeight: Math.round((maxWeight + incrementStep) * 10) / 10,
    };
  }

  if (maxReps >= targetReps - 2) {
    return {
      action: 'maintain',
      message: `Ótimo! Faltam ${targetReps - maxReps} reps para o topo (${targetReps}). Mantenha e busque mais uma.`,
    };
  }

  return {
    action: 'maintain',
    message: `Mantenha a carga (${maxWeight} kg) e foque em ganhar reps até ${targetReps}.`,
  };
}

/** Formata o peso anterior como referência para o treino atual. */
export function formatPrevious(weight: number, reps: number): string {
  return `${weight} kg × ${reps}`;
}

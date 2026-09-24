import { workoutLogService, buildLog } from './WorkoutLogService';
import { workoutService } from './WorkoutService';
import { findExerciseByIdOrName } from './ExerciseService';
import { CURATED_EXERCISES } from '../data/curatedExercises';
import type {
  Exercise,
  Workout,
  WorkoutLog,
  WorkoutLogExercise,
  WorkoutLogBlock,
  WorkoutSet,
  SetType,
  SetCategory,
  AdvancedTechniqueKind,
  WorkoutExercisePlan,
  AdvancedTechnique,
} from '../models';
import {
  planSetCategories,
  planWorkingSets,
  planWarmupSets,
  planPreparationSets,
  isCompositeTechnique,
  isWorkingSet,
  exBlocksFor,
} from '../models';

export interface ExecutionExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  plannedSets: number;
  plannedReps: number;
  warmupSets: number;
  preparationSets: number;
  workingSets: number;
  advancedTechnique?: AdvancedTechnique;
  blocks: WorkoutLogBlock[];
  sets: WorkoutSet[];
  completed: boolean;
  notes: string;
  restSeconds?: number;
}

export interface RestTriggerEvent {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  restSeconds: number;
  nextSetNumber?: number;
}

export interface WorkoutSessionSnapshot {
  workoutId: string | null;
  workout: Workout | null;
  startedAt: string | null;
  exercises: ExecutionExercise[];
  lastResults: Map<string, { weight: number; reps: number }[]>;
  isInitialized: boolean;
}

function techniqueToSetType(kind: AdvancedTechniqueKind | undefined): SetType {
  switch (kind) {
    case 'cluster': return 'cluster';
    case 'myo': return 'myo';
    case 'drop-set': return 'drop';
    case 'rest-pause': return 'backoff';
    default: return 'normal';
  }
}

function buildSetSegments(
  plan: WorkoutExercisePlan,
): { category: SetCategory; startNumber: number; type: SetType }[] {
  const techniqueKind = plan.advancedTechnique?.kind;
  const workingType = isCompositeTechnique(techniqueKind as AdvancedTechniqueKind)
    ? 'normal'
    : techniqueToSetType(techniqueKind);
  const categories = planSetCategories(plan);
  let warmupN = 0;
  let prepN = 0;
  let workingN = 0;
  return categories.map((cat) => {
    if (cat === 'warmup') {
      warmupN += 1;
      return { category: cat, startNumber: warmupN, type: 'normal' };
    }
    if (cat === 'preparation') {
      prepN += 1;
      return { category: cat, startNumber: prepN, type: 'normal' };
    }
    workingN += 1;
    return { category: cat, startNumber: workingN, type: workingType };
  });
}

function buildBlocks(plan: WorkoutExercisePlan): WorkoutLogBlock[] {
  const count = exBlocksFor(plan.advancedTechnique, plan.exerciseId);
  return Array.from({ length: count }, (_, i) => ({
    order: i + 1,
    targetReps: plan.plannedReps,
    weight: plan.initialWeight ?? 0,
    completed: false,
  }));
}

class WorkoutSessionService {
  private workoutId: string | null = null;
  private workout: Workout | null = null;
  private startedAt: string | null = null;
  private exercises: ExecutionExercise[] = [];
  private lastResults: Map<string, { weight: number; reps: number }[]> = new Map();
  private isInitialized = false;

  private snapshot: WorkoutSessionSnapshot;

  private listeners = new Set<() => void>();
  private restTriggerListeners = new Set<(event: RestTriggerEvent) => void>();

  constructor() {
    this.snapshot = {
      workoutId: null,
      workout: null,
      startedAt: null,
      exercises: [],
      lastResults: new Map(),
      isInitialized: false,
    };

    this.subscribe = this.subscribe.bind(this);
    this.onRestTrigger = this.onRestTrigger.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
    this.startSession = this.startSession.bind(this);
    this.toggleExerciseCompleted = this.toggleExerciseCompleted.bind(this);
    this.toggleSetCompleted = this.toggleSetCompleted.bind(this);
    this.updateSet = this.updateSet.bind(this);
    this.bumpWeight = this.bumpWeight.bind(this);
    this.addSet = this.addSet.bind(this);
    this.updateNotes = this.updateNotes.bind(this);
    this.toggleBlock = this.toggleBlock.bind(this);
    this.addExerciseToSession = this.addExerciseToSession.bind(this);
    this.replaceExercise = this.replaceExercise.bind(this);
    this.finishSession = this.finishSession.bind(this);
    this.clearSession = this.clearSession.bind(this);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onRestTrigger(listener: (event: RestTriggerEvent) => void): () => void {
    this.restTriggerListeners.add(listener);
    return () => this.restTriggerListeners.delete(listener);
  }

  private notify() {
    this.snapshot = {
      workoutId: this.workoutId,
      workout: this.workout,
      startedAt: this.startedAt,
      exercises: this.exercises,
      lastResults: this.lastResults,
      isInitialized: this.isInitialized,
    };
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Session notification error', e);
      }
    });
  }

  public getSnapshot(): WorkoutSessionSnapshot {
    return this.snapshot;
  }

  public async startSession(
    workout: Workout,
    exercisesCatalog: Exercise[],
  ): Promise<void> {
    // Se a mesma sessão já estiver em andamento, não reinicia
    if (this.isInitialized && this.workoutId === workout.id) {
      return;
    }

    this.workoutId = workout.id;
    this.workout = workout;
    this.startedAt = new Date().toISOString();
    this.isInitialized = true;

    const ordered = [...workout.exercises].sort((a, b) => a.order - b.order);
    this.exercises = ordered.map((we) => {
      const ex =
        findExerciseByIdOrName(exercisesCatalog, we.exerciseId) ||
        CURATED_EXERCISES.find((c) => c.name.toLowerCase() === we.exerciseId.toLowerCase());
      const initialWeight = we.initialWeight ?? 0;
      const segments = buildSetSegments(we);
      const sets = segments.map((seg, i) => ({
        id: `p-${i}`,
        setNumber: i + 1,
        weight: initialWeight,
        reps: we.plannedReps > 0 ? we.plannedReps : 10,
        completed: false,
        type: seg.type,
        category: seg.category,
        isCustomWeight: false,
        isCustomReps: false,
      }));

      return {
        exerciseId: we.exerciseId,
        exerciseName: ex?.name ?? 'Exercício',
        muscleGroup: ex?.muscleGroup ?? '',
        plannedSets: planWorkingSets(we),
        plannedReps: we.plannedReps,
        warmupSets: planWarmupSets(we),
        preparationSets: planPreparationSets(we),
        workingSets: planWorkingSets(we),
        advancedTechnique: we.advancedTechnique,
        restSeconds: we.restSeconds,
        blocks: buildBlocks(we),
        sets,
        completed: false,
        notes: '',
      };
    });

    this.notify();

    // Carrega histórico do último treino em segundo plano
    const map = new Map<string, { weight: number; reps: number }[]>();
    for (const we of ordered) {
      const last = await workoutLogService.getLastByExercise(we.exerciseId);
      if (last && last.length > 0) {
        map.set(we.exerciseId, last);
      }
    }
    this.lastResults = map;

    // Preenche séries não editadas com os valores do histórico
    this.exercises = this.exercises.map((e) => {
      const history = map.get(e.exerciseId);
      if (!history || history.length === 0) return e;
      return {
        ...e,
        sets: e.sets.map((s, idx) => {
          if (s.completed || s.isCustomWeight) return s;
          const histItem = history[idx] ?? history[history.length - 1];
          if (histItem && s.weight <= 0) {
            return { ...s, weight: histItem.weight, reps: histItem.reps > 0 ? histItem.reps : s.reps };
          }
          return s;
        }),
      };
    });

    this.notify();
  }

  public toggleExerciseCompleted(exerciseId: string) {
    this.exercises = this.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const nextCompleted = !e.completed;
      return {
        ...e,
        completed: nextCompleted,
        sets: e.sets.map((s) => ({ ...s, completed: nextCompleted })),
      };
    });
    this.notify();
  }

  public toggleSetCompleted(exerciseId: string, setId: string) {
    let triggeredRest: RestTriggerEvent | null = null;

    this.exercises = this.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const setIdx = e.sets.findIndex((s) => s.id === setId);
      if (setIdx === -1) return e;
      const target = e.sets[setIdx];

      if (target.completed) {
        const updated = [...e.sets];
        updated[setIdx] = { ...target, completed: false };
        return { ...e, sets: updated, completed: false };
      }

      // Preenche dados padrão se zerados
      const history = this.lastResults.get(exerciseId);
      const historyItem = history?.[setIdx] ?? (history && history.length > 0 ? history[history.length - 1] : null);

      let weight = target.weight;
      let reps = target.reps;

      if (weight <= 0) {
        const prevSet = setIdx > 0 ? e.sets[setIdx - 1] : null;
        if (prevSet && prevSet.weight > 0) {
          weight = prevSet.weight;
        } else if (historyItem && historyItem.weight > 0) {
          weight = historyItem.weight;
        } else {
          const planEx = this.workout?.exercises.find((we) => we.exerciseId === exerciseId);
          weight = planEx?.initialWeight ?? 0;
        }
      }

      if (reps <= 0) {
        const prevSet = setIdx > 0 ? e.sets[setIdx - 1] : null;
        if (prevSet && prevSet.reps > 0) {
          reps = prevSet.reps;
        } else if (historyItem && historyItem.reps > 0) {
          reps = historyItem.reps;
        } else {
          reps = e.plannedReps > 0 ? e.plannedReps : 10;
        }
      }

      const updated = [...e.sets];
      updated[setIdx] = { ...target, weight, reps, completed: true };

      // Se há próxima série pendente com carga 0, propaga a carga
      if (setIdx + 1 < updated.length) {
        const nextSet = updated[setIdx + 1];
        if (!nextSet.completed && nextSet.weight <= 0) {
          updated[setIdx + 1] = { ...nextSet, weight };
        }
      }

      // Dispara descanso se configurado e não for a última série
      if (e.restSeconds && e.restSeconds > 0) {
        const nextPending = updated.find((s, i) => i > setIdx && !s.completed);
        triggeredRest = {
          exerciseId,
          exerciseName: e.exerciseName,
          setNumber: target.setNumber,
          restSeconds: e.restSeconds,
          nextSetNumber: nextPending?.setNumber,
        };
      }

      const allCompleted = updated.every((s) => s.completed);
      return { ...e, sets: updated, completed: allCompleted };
    });

    this.notify();

    if (triggeredRest) {
      this.restTriggerListeners.forEach((fn) => fn(triggeredRest!));
    }
  }

  public updateSet(exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) {
    this.exercises = this.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const setIdx = e.sets.findIndex((s) => s.id === setId);
      if (setIdx === -1) return e;

      const target = e.sets[setIdx];
      const updated = [...e.sets];
      updated[setIdx] = {
        ...target,
        [field]: value,
        ...(field === 'weight' ? { isCustomWeight: true } : { isCustomReps: true }),
      };

      if (field === 'weight') {
        for (let i = setIdx + 1; i < updated.length; i++) {
          if (!updated[i].completed && !updated[i].isCustomWeight) {
            updated[i] = { ...updated[i], weight: value };
          }
        }
      }

      return { ...e, sets: updated };
    });
    this.notify();
  }

  public bumpWeight(exerciseId: string, setId: string, delta: number) {
    this.exercises = this.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const setIdx = e.sets.findIndex((s) => s.id === setId);
      if (setIdx === -1) return e;
      const target = e.sets[setIdx];

      let baseWeight = target.weight;
      if (baseWeight <= 0) {
        const history = this.lastResults.get(exerciseId);
        const historyItem = history?.[setIdx] ?? (history && history.length > 0 ? history[history.length - 1] : null);
        baseWeight = historyItem?.weight ?? this.workout?.exercises.find((we) => we.exerciseId === exerciseId)?.initialWeight ?? 0;
      }

      const weight = Math.max(0, Math.round((baseWeight + delta) * 10) / 10);
      const updated = [...e.sets];
      updated[setIdx] = { ...target, weight, isCustomWeight: true };

      if (setIdx + 1 < updated.length) {
        const nextSet = updated[setIdx + 1];
        if (!nextSet.completed && nextSet.weight <= 0) {
          updated[setIdx + 1] = { ...nextSet, weight };
        }
      }

      return { ...e, sets: updated };
    });
    this.notify();
  }

  public addSet(exerciseId: string) {
    this.exercises = this.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const last = e.sets[e.sets.length - 1];
      return {
        ...e,
        sets: [
          ...e.sets,
          {
            id: `new-${Date.now()}`,
            setNumber: last ? last.setNumber + 1 : 1,
            weight: last ? last.weight : 0,
            reps: last?.reps ?? 10,
            completed: false,
            type: last?.type ?? 'normal',
            category: last?.category ?? 'working',
          },
        ],
      };
    });
    this.notify();
  }

  public updateNotes(exerciseId: string, notes: string) {
    this.exercises = this.exercises.map((e) =>
      e.exerciseId === exerciseId ? { ...e, notes } : e,
    );
    this.notify();
  }

  public toggleBlock(exerciseId: string, blockOrder: number) {
    this.exercises = this.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      return {
        ...e,
        blocks: e.blocks.map((b) =>
          b.order === blockOrder ? { ...b, completed: !b.completed } : b,
        ),
      };
    });
    this.notify();
  }

  public async addExerciseToSession(exercise: Exercise) {
    if (this.exercises.some((e) => e.exerciseId === exercise.id)) return;
    const next: ExecutionExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      plannedSets: 3,
      plannedReps: 10,
      warmupSets: 0,
      preparationSets: 0,
      workingSets: 3,
      blocks: [],
      sets: Array.from({ length: 3 }, (_, i) => ({
        id: `initial-${Date.now()}-${i}`,
        setNumber: i + 1,
        weight: 0,
        reps: 10,
        completed: false,
        type: 'normal',
        category: 'working',
      })),
      completed: false,
      notes: '',
    };
    this.exercises = [...this.exercises, next];
    this.notify();

    if (this.workout) {
      const plan = [...this.workout.exercises];
      plan.push({
        exerciseId: exercise.id,
        order: plan.length + 1,
        plannedSets: 3,
        plannedReps: 10,
      });
      try {
        await workoutService.saveWorkout(this.workout.name, plan, this.workout.id);
      } catch {
        // melhor esforço
      }
    }
  }

  public replaceExercise(oldExerciseId: string, substitute: Exercise) {
    this.exercises = this.exercises.map((item) => {
      if (item.exerciseId !== oldExerciseId) return item;
      return {
        ...item,
        exerciseId: substitute.id,
        exerciseName: substitute.name,
        muscleGroup: substitute.muscleGroup,
      };
    });
    this.notify();
  }

  public async finishSession(): Promise<{ durationSeconds: number; volume: number; series: number }> {
    const finishedAt = new Date().toISOString();
    const logExercises: WorkoutLogExercise[] = this.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      muscleGroup: e.muscleGroup,
      plannedSets: e.plannedSets,
      plannedReps: e.plannedReps,
      notes: e.notes?.trim() ? e.notes.trim() : undefined,
      blocks: e.blocks.length > 0 ? e.blocks : undefined,
      sets: e.sets,
      completed: e.completed,
    }));

    const log = buildLog({
      workoutId: this.workoutId ?? 'workout',
      workoutName: this.workout?.name ?? 'Treino',
      startedAt: this.startedAt ?? new Date().toISOString(),
      finishedAt,
      exercises: logExercises,
    });

    await workoutLogService.saveLog(log);
    await workoutLogService.invalidate();
    await workoutService.invalidate();

    const workingSetsDone = this.exercises.reduce(
      (acc, e) => acc + e.sets.filter((s) => s.completed && isWorkingSet(s)).length,
      0,
    );

    const payload = {
      durationSeconds: log.durationSeconds,
      volume: log.totalVolume,
      series: workingSetsDone,
    };

    this.clearSession();
    return payload;
  }

  public clearSession() {
    this.workoutId = null;
    this.workout = null;
    this.startedAt = null;
    this.exercises = [];
    this.lastResults = new Map();
    this.isInitialized = false;
    this.notify();
  }
}

export const workoutSessionService = new WorkoutSessionService();

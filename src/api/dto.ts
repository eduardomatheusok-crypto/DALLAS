import type { Exercise, Workout, WorkoutExercisePlan, WorkoutLog, WorkoutLogExercise, WorkoutLogBlock, WorkoutSet, SetType, SetCategory, AdvancedTechnique } from '../models';
import { SET_TYPES } from '../models';

// ----- API DTOs (espelham o backend Spring Boot) -----

export interface ExerciseDto {
  id: string;
  name: string;
  muscleGroup: string;
  custom: boolean;
  createdAt: string;
}

export interface AdvancedTechniqueExerciseDto {
  exerciseId: string;
  exerciseName?: string;
  order: number;
  blocks?: number;
}

export interface AdvancedTechniqueDto {
  kind: string;
  exercises?: AdvancedTechniqueExerciseDto[];
  config?: Record<string, number | string | boolean>;
}

export interface WorkoutExercisePlanDto {
  id?: string;
  exerciseId: string;
  order: number;
  plannedSets: number;
  plannedReps: number;
  initialWeight?: number;
  warmupSets?: number;
  preparationSets?: number;
  workingSets?: number;
  advancedTechnique?: AdvancedTechniqueDto;
}

export interface WorkoutDto {
  id: string;
  name: string;
  exercises: WorkoutExercisePlanDto[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSetDto {
  id?: string;
  setNumber: number;
  weight: number;
  reps: number;
  done: boolean;
  type?: string;
  category?: string;
}

export interface WorkoutLogBlockDto {
  order: number;
  targetReps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutLogExerciseDto {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  order: number;
  plannedSets: number;
  plannedReps: number;
  done: boolean;
  notes?: string;
  blocks?: WorkoutLogBlockDto[];
  sets: WorkoutSetDto[];
}

export interface WorkoutLogDto {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  exercises: WorkoutLogExerciseDto[];
  totalVolume: number;
}

export interface UserDto {
  id: string;
  username: string;
  name: string;
  deviceId?: string;
  createdAt: string;
}

// ----- Conversões app model <-> DTO -----

export function exerciseToDto(e: Exercise): ExerciseDto {
  return { id: e.id, name: e.name, muscleGroup: e.muscleGroup, custom: e.isCustom, createdAt: e.createdAt };
}

export function exerciseFromDto(d: ExerciseDto): Exercise {
  return { id: d.id, name: d.name, muscleGroup: d.muscleGroup as Exercise['muscleGroup'], isCustom: d.custom, createdAt: d.createdAt };
}

export function workoutToDto(w: Workout): WorkoutDto {
  return {
    id: w.id,
    name: w.name,
    exercises: w.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      order: e.order,
      plannedSets: e.plannedSets,
      plannedReps: e.plannedReps,
      initialWeight: e.initialWeight,
      warmupSets: e.warmupSets,
      preparationSets: e.preparationSets,
      workingSets: e.workingSets,
      advancedTechnique: e.advancedTechnique ? techniqueToDto(e.advancedTechnique) : undefined,
    })),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

function techniqueToDto(t: AdvancedTechnique): AdvancedTechniqueDto {
  return {
    kind: t.kind,
    exercises: t.exercises?.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      order: ex.order,
      blocks: ex.blocks,
    })),
    config: t.config,
  };
}

function techniqueFromDto(d: AdvancedTechniqueDto): AdvancedTechnique {
  return {
    kind: d.kind as AdvancedTechnique['kind'],
    exercises: d.exercises?.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      order: ex.order,
      blocks: ex.blocks,
    })),
    config: d.config,
  };
}

export function workoutFromDto(d: WorkoutDto): Workout {
  return {
    id: d.id,
    name: d.name,
    exercises: d.exercises.map((e): WorkoutExercisePlan => ({
      exerciseId: e.exerciseId,
      order: e.order,
      plannedSets: e.plannedSets,
      plannedReps: e.plannedReps,
      initialWeight: e.initialWeight,
      warmupSets: e.warmupSets,
      preparationSets: e.preparationSets,
      workingSets: e.workingSets,
      advancedTechnique: e.advancedTechnique ? techniqueFromDto(e.advancedTechnique) : undefined,
    })),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export function logToDto(log: WorkoutLog): WorkoutLogDto {
  return {
    id: log.id,
    workoutId: log.workoutId,
    workoutName: log.workoutName,
    startedAt: log.startedAt,
    finishedAt: log.finishedAt,
    durationSeconds: log.durationSeconds,
    totalVolume: log.totalVolume,
    exercises: log.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      order: log.exercises.indexOf(ex),
      plannedSets: ex.plannedSets,
      plannedReps: ex.plannedReps,
      done: ex.completed,
      notes: ex.notes,
      blocks: ex.blocks?.map((b): WorkoutLogBlockDto => ({
        order: b.order,
        targetReps: b.targetReps,
        weight: b.weight,
        completed: b.completed,
      })),
      sets: ex.sets.map((s): WorkoutSetDto => ({
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        done: s.completed,
        type: s.type ?? 'normal',
        category: s.category,
      })),
    })),
  };
}

export function logFromDto(d: WorkoutLogDto): WorkoutLog {
  return {
    id: d.id,
    workoutId: d.workoutId,
    workoutName: d.workoutName,
    startedAt: d.startedAt,
    finishedAt: d.finishedAt,
    durationSeconds: d.durationSeconds,
    totalVolume: d.totalVolume,
    exercises: d.exercises.map((ex): WorkoutLogExercise => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      plannedSets: ex.plannedSets,
      plannedReps: ex.plannedReps,
      completed: ex.done,
      notes: ex.notes,
      blocks: ex.blocks?.map((b): WorkoutLogBlock => ({
        order: b.order,
        targetReps: b.targetReps,
        weight: b.weight,
        completed: b.completed,
      })),
      sets: ex.sets.map((s): WorkoutSet => ({
        id: s.id ?? `${d.id}-${ex.exerciseId}-${s.setNumber}`,
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        completed: s.done,
        type: normalizeSetType(s.type),
        category: normalizeSetCategory(s.category),
      })),
    })),
  };
}

const VALID_SET_TYPES = new Set<string>(SET_TYPES.map((t) => t.value));

function normalizeSetType(value: string | undefined): SetType {
  return value && VALID_SET_TYPES.has(value) ? (value as SetType) : 'normal';
}

const VALID_SET_CATEGORIES = new Set<string>(['warmup', 'preparation', 'working']);

function normalizeSetCategory(value: string | undefined): SetCategory | undefined {
  return value && VALID_SET_CATEGORIES.has(value) ? (value as SetCategory) : undefined;
}

// ----- Grupos / Competições / Chat -----

export interface MemberDto {
  user: UserDto;
  role: string;
  joinedAt: string;
}

export interface GroupSummaryDto {
  id: string;
  name: string;
  description?: string;
  icon: string;
  memberCount: number;
  ownerId: string;
  createdAt: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  icon: string;
  inviteCode: string;
  ownerId: string;
  joined: boolean;
  myRole: string;
  memberCount: number;
  members: MemberDto[];
  createdAt: string;
}

export interface CompetitionDto {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  status: 'PENDING' | 'ACTIVE' | 'FINISHED';
  startsAt: string;
  endsAt: string;
  awardedPositions: number;
  participantCount: number;
  joined: boolean;
  ownerId: string;
  createdAt: string;
}

export interface RankingStatsDto {
  progressPct: number;
  trainedDays: number;
  totalVolume: number;
  prCount: number;
}

export interface RankingEntryDto {
  user: UserDto;
  position: number;
  totalScore: number;
  progressionScore: number;
  consistencyScore: number;
  volumeScore: number;
  goalsScore: number;
  stats: RankingStatsDto;
}

export interface ChatMessageDto {
  id: string;
  userId?: string;
  authorName: string;
  text: string;
  isSystem: boolean;
  sentAt: string;
}

function userFromDto(d: UserDto): import('../models').User {
  return { id: d.id, username: d.username, name: d.name, createdAt: d.createdAt };
}

export function groupSummaryFromDto(d: GroupSummaryDto): import('../models').GroupSummary {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    icon: d.icon,
    memberCount: d.memberCount,
    ownerId: d.ownerId,
    createdAt: d.createdAt,
  };
}

export function groupFromDto(d: GroupDto): import('../models').Group {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    icon: d.icon,
    inviteCode: d.inviteCode,
    ownerId: d.ownerId,
    joined: d.joined,
    myRole: d.myRole,
    memberCount: d.memberCount,
    members: d.members.map((m) => ({ user: userFromDto(m.user), role: m.role, joinedAt: m.joinedAt })),
    createdAt: d.createdAt,
  };
}

export function competitionFromDto(d: CompetitionDto): import('../models').Competition {
  return {
    id: d.id,
    groupId: d.groupId,
    name: d.name,
    description: d.description,
    status: d.status,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    awardedPositions: d.awardedPositions,
    participantCount: d.participantCount,
    joined: d.joined,
    ownerId: d.ownerId,
    createdAt: d.createdAt,
  };
}

export function rankingEntryFromDto(d: RankingEntryDto): import('../models').RankingEntry {
  return {
    user: userFromDto(d.user),
    position: d.position,
    totalScore: d.totalScore,
    progressionScore: d.progressionScore,
    consistencyScore: d.consistencyScore,
    volumeScore: d.volumeScore,
    goalsScore: d.goalsScore,
    stats: {
      progressPct: d.stats.progressPct,
      trainedDays: d.stats.trainedDays,
      totalVolume: d.stats.totalVolume,
      prCount: d.stats.prCount,
    },
  };
}

export function messageFromDto(d: ChatMessageDto): import('../models').ChatMessage {
  return {
    id: d.id,
    userId: d.userId,
    authorName: d.authorName,
    text: d.text,
    isSystem: d.isSystem,
    sentAt: d.sentAt,
  };
}

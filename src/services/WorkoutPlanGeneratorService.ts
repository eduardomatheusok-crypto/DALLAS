import type { UserTrainingPreferences, WeekDay } from '../models/UserTrainingPreferences';
import { WEEK_DAYS } from '../models/UserTrainingPreferences';
import type { Workout, Exercise } from '../models';
import { WORKOUT_TEMPLATES, MOVEMENTS, type Movement } from '../data/workoutTemplates';
import { exerciseService, isCatalogExercise } from './ExerciseService';
import { prepareExerciseImages } from './ExerciseMediaCache';
import { workoutService } from './WorkoutService';

export interface AssignedDayWorkout { day: WeekDay; dayLabel: string; shortLabel: string; workoutName: string }
export interface GeneratedPlanResult {
  templateId: string; templateTitle: string; subtitle: string;
  schedule: AssignedDayWorkout[]; workouts: Workout[];
}
const normalize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/** Ordered, reviewed biomechanical equivalents; no arbitrary muscle-group/image matching. */
export function resolveMovement(movement: Movement, catalog: Exercise[], used: Set<string>): Exercise {
  for (const name of MOVEMENTS[movement]) {
    const match = catalog.find(e => isCatalogExercise(e) && !used.has(e.id) && normalize(e.name) === normalize(name));
    if (match) return match;
  }
  throw new Error(`O catálogo não possui uma alternativa com imagem para ${MOVEMENTS[movement][0]}. Conecte-se e tente novamente.`);
}

export class WorkoutPlanGeneratorService {
  resolveTemplateId(prefs: UserTrainingPreferences): string {
    if (prefs.preference === 'manual' || prefs.assignedTemplateId === 'manual') return 'manual';
    if (prefs.assignedTemplateId && prefs.assignedTemplateId !== 'auto') return prefs.assignedTemplateId;
    if (prefs.preference && prefs.preference !== 'auto') return prefs.preference;
    const frequency = prefs.exactFrequency || prefs.trainingDays.length;
    return frequency <= 3 ? 'FULL_BODY_3X' : frequency === 5 ? 'PPL_UPPER_LOWER_5X' : 'UPPER_LOWER_4X';
  }

  async generatePlan(prefs: UserTrainingPreferences): Promise<GeneratedPlanResult> {
    const templateId = this.resolveTemplateId(prefs);
    if (templateId === 'manual') return { templateId, templateTitle: 'POR MIM', subtitle: 'Monte seus próprios treinos', schedule: [], workouts: [] };
    const template = WORKOUT_TEMPLATES[templateId];
    if (!template) throw new Error('Escolha uma divisão de treino válida.');
    const { plannedSets, plannedReps } = prefs;
    if (!Number.isInteger(plannedSets) || !Number.isInteger(plannedReps) || !plannedSets || !plannedReps || plannedSets < 1 || plannedSets > 10 || plannedReps < 1 || plannedReps > 100) {
      throw new Error('Escolha de 1 a 10 séries e de 1 a 100 repetições.');
    }
    const catalog = await exerciseService.getCatalog();
    const now = new Date().toISOString();
    const workouts = template.routines.map((routine, index): Workout => {
      const used = new Set<string>();
      return {
        id: `onboarding-${prefs.userId}-${templateId}-${index}`, name: routine.name, createdAt: now, updatedAt: now,
        exercises: routine.movements.map((movement, order) => {
          const exercise = resolveMovement(movement, catalog, used);
          used.add(exercise.id);
          return { exerciseId: exercise.id, order: order + 1, plannedSets, plannedReps };
        }),
      };
    });
    const usedIds = new Set(workouts.flatMap(w => w.exercises.map(e => e.exerciseId)));
    await prepareExerciseImages(catalog.filter(e => usedIds.has(e.id)));
    return {
      templateId, templateTitle: template.title, subtitle: `${workouts.length} TREINOS • ${plannedSets} × ${plannedReps}`,
      workouts,
      schedule: prefs.trainingDays.map((day, index) => ({ day, dayLabel: WEEK_DAYS.find(d => d.value === day)!.label,
        shortLabel: WEEK_DAYS.find(d => d.value === day)!.shortLabel, workoutName: workouts[index % workouts.length].name })),
    };
  }

  async savePlanWorkouts(workouts: Workout[]): Promise<void> {
    await workoutService.saveGeneratedWorkouts(workouts);
  }
}
export const workoutPlanGeneratorService = new WorkoutPlanGeneratorService();

import type { UserTrainingPreferences, WeekDay } from '../models/UserTrainingPreferences';
import type { Workout, WorkoutExercisePlan } from '../models/Workout';
import { workoutService } from './WorkoutService';

export interface AssignedDayWorkout {
  day: WeekDay;
  dayLabel: string;
  shortLabel: string;
  workoutName: string;
}

export interface GeneratedPlanResult {
  templateId: string;
  templateTitle: string;
  subtitle: string;
  schedule: AssignedDayWorkout[];
  workouts: Workout[];
}

const DAY_LABELS: Record<WeekDay, { full: string; short: string }> = {
  monday: { full: 'Segunda-feira', short: 'SEG' },
  tuesday: { full: 'Terça-feira', short: 'TER' },
  wednesday: { full: 'Quarta-feira', short: 'QUA' },
  thursday: { full: 'Quinta-feira', short: 'QUI' },
  friday: { full: 'Sexta-feira', short: 'SEX' },
  saturday: { full: 'Sábado', short: 'SÁB' },
  sunday: { full: 'Domingo', short: 'DOM' },
};

export class WorkoutPlanGeneratorService {
  /**
   * Determina o template mais compatível baseado nas preferências do usuário.
   */
  resolveTemplateId(prefs: UserTrainingPreferences): string {
    if (prefs.assignedTemplateId && prefs.assignedTemplateId !== 'auto') {
      return prefs.assignedTemplateId;
    }
    const freq = prefs.exactFrequency || prefs.trainingDays.length || 4;
    const isBeginner = prefs.experience === 'beginner';

    switch (freq) {
      case 2:
        return 'FULL_BODY_2X';
      case 3:
        return isBeginner ? 'FULL_BODY_3X' : 'PPL_3X';
      case 4:
        return 'UPPER_LOWER_4X';
      case 5:
        return 'PPL_UPPER_LOWER_5X';
      case 6:
        return 'PPL_6X';
      default:
        return 'UPPER_LOWER_4X';
    }
  }

  /**
   * Gera a lista de treinos e mapeia para a grade de dias do usuário.
   */
  generatePlan(prefs: UserTrainingPreferences): GeneratedPlanResult {
    const templateId = this.resolveTemplateId(prefs);
    const days = prefs.trainingDays;
    const isBodyweight = prefs.location === 'bodyweight';
    const isHome = prefs.location === 'home';

    let templateTitle = 'UPPER / LOWER';
    let subtitle = 'HIPERTROFIA • 4X';
    let routineRaws: { name: string; exercises: WorkoutExercisePlan[] }[] = [];

    if (templateId === 'FULL_BODY_2X') {
      templateTitle = 'FULL BODY';
      subtitle = 'CORPO INTEIRO • 2X';
      routineRaws = [
        {
          name: 'FULL BODY A',
          exercises: [
            { exerciseId: isBodyweight ? 'flexao-de-braco' : 'supino-reto', order: 1, plannedSets: 3, plannedReps: 10 },
            { exerciseId: isBodyweight ? 'agachamento-livre' : 'agachamento-livre', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'remada-curvada', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'desenvolvimento-halteres', order: 4, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'FULL BODY B',
          exercises: [
            { exerciseId: 'levantamento-terra', order: 1, plannedSets: 3, plannedReps: 8 },
            { exerciseId: isBodyweight ? 'afundo' : 'leg-press', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'puxada-alta', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'elevacao-lateral', order: 4, plannedSets: 3, plannedReps: 12 },
          ],
        },
      ];
    } else if (templateId === 'FULL_BODY_3X') {
      templateTitle = 'FULL BODY';
      subtitle = 'CORPO INTEIRO • 3X';
      routineRaws = [
        {
          name: 'FULL BODY A',
          exercises: [
            { exerciseId: 'supino-reto', order: 1, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'agachamento-livre', order: 2, plannedSets: 3, plannedReps: 8 },
            { exerciseId: 'remada-curvada', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'desenvolvimento-halteres', order: 4, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'FULL BODY B',
          exercises: [
            { exerciseId: 'levantamento-terra', order: 1, plannedSets: 3, plannedReps: 8 },
            { exerciseId: 'supino-inclinado', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'puxada-alta', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'rosca-direta', order: 4, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'FULL BODY C',
          exercises: [
            { exerciseId: 'leg-press', order: 1, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'crucifixo-halteres', order: 2, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'elevacao-lateral', order: 3, plannedSets: 4, plannedReps: 12 },
            { exerciseId: 'triceps-testa', order: 4, plannedSets: 3, plannedReps: 12 },
          ],
        },
      ];
    } else if (templateId === 'PPL_3X') {
      templateTitle = 'PUSH • PULL • LEGS';
      subtitle = 'DIVISÃO CLÁSSICA • 3X';
      routineRaws = [
        {
          name: 'PUSH (EMPURRAR)',
          exercises: [
            { exerciseId: 'supino-reto', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'supino-inclinado', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'desenvolvimento-halteres', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'elevacao-lateral', order: 4, plannedSets: 4, plannedReps: 12 },
            { exerciseId: 'triceps-testa', order: 5, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'PULL (PUXAR)',
          exercises: [
            { exerciseId: 'puxada-alta', order: 1, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'remada-curvada', order: 2, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'crucifixo-inverso', order: 3, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'rosca-direta', order: 4, plannedSets: 4, plannedReps: 10 },
          ],
        },
        {
          name: 'LEGS (PERNAS)',
          exercises: [
            { exerciseId: 'agachamento-livre', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'leg-press', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'stiff', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'cadeira-extensora', order: 4, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'panturrilha-pe', order: 5, plannedSets: 4, plannedReps: 15 },
          ],
        },
      ];
    } else if (templateId === 'PPL_UPPER_LOWER_5X') {
      templateTitle = 'PPL + UPPER / LOWER';
      subtitle = 'ALTA PERFORMANCE • 5X';
      routineRaws = [
        {
          name: 'PUSH',
          exercises: [
            { exerciseId: 'supino-reto', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'supino-inclinado', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'desenvolvimento-halteres', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'elevacao-lateral', order: 4, plannedSets: 4, plannedReps: 12 },
          ],
        },
        {
          name: 'PULL',
          exercises: [
            { exerciseId: 'puxada-alta', order: 1, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'remada-curvada', order: 2, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'rosca-direta', order: 3, plannedSets: 4, plannedReps: 10 },
          ],
        },
        {
          name: 'LEGS',
          exercises: [
            { exerciseId: 'agachamento-livre', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'leg-press', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'stiff', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'panturrilha-pe', order: 4, plannedSets: 4, plannedReps: 15 },
          ],
        },
        {
          name: 'UPPER',
          exercises: [
            { exerciseId: 'supino-inclinado', order: 1, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'remada-curvada', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'desenvolvimento-halteres', order: 3, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'triceps-testa', order: 4, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'LOWER',
          exercises: [
            { exerciseId: 'levantamento-terra', order: 1, plannedSets: 4, plannedReps: 6 },
            { exerciseId: 'leg-press', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'cadeira-extensora', order: 3, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'panturrilha-pe', order: 4, plannedSets: 4, plannedReps: 15 },
          ],
        },
      ];
    } else if (templateId === 'PPL_6X') {
      templateTitle = 'PPL 2X';
      subtitle = 'INTENSIDADE MÁXIMA • 6X';
      routineRaws = [
        {
          name: 'PUSH A',
          exercises: [
            { exerciseId: 'supino-reto', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'desenvolvimento-halteres', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'elevacao-lateral', order: 3, plannedSets: 4, plannedReps: 12 },
          ],
        },
        {
          name: 'PULL A',
          exercises: [
            { exerciseId: 'puxada-alta', order: 1, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'remada-curvada', order: 2, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'rosca-direta', order: 3, plannedSets: 4, plannedReps: 10 },
          ],
        },
        {
          name: 'LEGS A',
          exercises: [
            { exerciseId: 'agachamento-livre', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'leg-press', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'panturrilha-pe', order: 3, plannedSets: 4, plannedReps: 15 },
          ],
        },
        {
          name: 'PUSH B',
          exercises: [
            { exerciseId: 'supino-inclinado', order: 1, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'crucifixo-halteres', order: 2, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'triceps-testa', order: 3, plannedSets: 4, plannedReps: 12 },
          ],
        },
        {
          name: 'PULL B',
          exercises: [
            { exerciseId: 'remada-curvada', order: 1, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'puxada-alta', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'rosca-martelo', order: 3, plannedSets: 4, plannedReps: 12 },
          ],
        },
        {
          name: 'LEGS B',
          exercises: [
            { exerciseId: 'levantamento-terra', order: 1, plannedSets: 4, plannedReps: 6 },
            { exerciseId: 'stiff', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'cadeira-extensora', order: 3, plannedSets: 3, plannedReps: 12 },
          ],
        },
      ];
    } else if (templateId === 'ANTERIOR_POSTERIOR_4X') {
      templateTitle = 'ANTERIOR / POSTERIOR';
      subtitle = 'CADEIAS MUSCULARES • 4X';
      routineRaws = [
        {
          name: 'ANTERIOR A (QUADRÍCEPS & PEITO)',
          exercises: [
            { exerciseId: 'agachamento-livre', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'leg-press', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'supino-reto', order: 3, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'desenvolvimento-halteres', order: 4, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'triceps-testa', order: 5, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'POSTERIOR A (ISQUIOTIBIAIS & COSTAS)',
          exercises: [
            { exerciseId: 'levantamento-terra', order: 1, plannedSets: 4, plannedReps: 6 },
            { exerciseId: 'stiff', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'puxada-alta', order: 3, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'remada-curvada', order: 4, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'rosca-direta', order: 5, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'ANTERIOR B (FOCO FRONTAL & OMBROS)',
          exercises: [
            { exerciseId: 'cadeira-extensora', order: 1, plannedSets: 4, plannedReps: 12 },
            { exerciseId: 'afundo', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'supino-inclinado', order: 3, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'elevacao-lateral', order: 4, plannedSets: 4, plannedReps: 12 },
          ],
        },
        {
          name: 'POSTERIOR B (FOCO GLÚTEO & DORSAL)',
          exercises: [
            { exerciseId: 'stiff', order: 1, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'panturrilha-pe', order: 2, plannedSets: 4, plannedReps: 15 },
            { exerciseId: 'remada-curvada', order: 3, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'crucifixo-inverso', order: 4, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'rosca-martelo', order: 5, plannedSets: 3, plannedReps: 12 },
          ],
        },
      ];
    } else {
      // Default: UPPER_LOWER_4X
      templateTitle = 'UPPER / LOWER';
      subtitle = 'HIPERTROFIA • 4X';
      routineRaws = [
        {
          name: 'UPPER A',
          exercises: [
            { exerciseId: 'supino-reto', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'remada-curvada', order: 2, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'desenvolvimento-halteres', order: 3, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'rosca-direta', order: 4, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'LOWER A',
          exercises: [
            { exerciseId: 'agachamento-livre', order: 1, plannedSets: 4, plannedReps: 8 },
            { exerciseId: 'leg-press', order: 2, plannedSets: 3, plannedReps: 10 },
            { exerciseId: 'cadeira-extensora', order: 3, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'stiff', order: 4, plannedSets: 3, plannedReps: 10 },
          ],
        },
        {
          name: 'UPPER B',
          exercises: [
            { exerciseId: 'supino-inclinado', order: 1, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'puxada-alta', order: 2, plannedSets: 4, plannedReps: 10 },
            { exerciseId: 'elevacao-lateral', order: 3, plannedSets: 4, plannedReps: 12 },
            { exerciseId: 'triceps-testa', order: 4, plannedSets: 3, plannedReps: 12 },
          ],
        },
        {
          name: 'LOWER B',
          exercises: [
            { exerciseId: 'levantamento-terra', order: 1, plannedSets: 4, plannedReps: 6 },
            { exerciseId: 'leg-press', order: 2, plannedSets: 3, plannedReps: 12 },
            { exerciseId: 'panturrilha-pe', order: 3, plannedSets: 4, plannedReps: 15 },
          ],
        },
      ];
    }

    // Mapeia para a grade de dias
    const schedule: AssignedDayWorkout[] = days.map((day, idx) => {
      const routine = routineRaws[idx % routineRaws.length];
      const labels = DAY_LABELS[day];
      return {
        day,
        dayLabel: labels.full,
        shortLabel: labels.short,
        workoutName: routine.name,
      };
    });

    const now = new Date().toISOString();
    const workouts: Workout[] = routineRaws.map((raw, idx) => ({
      id: `initial-workout-${idx + 1}-${Date.now()}`,
      name: raw.name,
      exercises: raw.exercises,
      createdAt: now,
      updatedAt: now,
    }));

    return {
      templateId,
      templateTitle,
      subtitle,
      schedule,
      workouts,
    };
  }

  /**
   * Salva os treinos gerados no storage e banco de dados.
   */
  async savePlanWorkouts(workouts: Workout[]): Promise<void> {
    for (const w of workouts) {
      await workoutService.saveWorkout(w.name, w.exercises);
    }
  }
}

export const workoutPlanGeneratorService = new WorkoutPlanGeneratorService();

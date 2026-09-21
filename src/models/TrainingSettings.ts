import type { WeekDay } from './UserTrainingPreferences';

/**
 * Configurações de treino do DALLAS — descanso, notificações e lembretes.
 *
 * Armazenadas localmente até haver sincronização com o backend (Spring Boot).
 * Campos novos sempre possuem valores padrão para não regredir usuários existentes.
 */
export interface TrainingSettings {
  /**
   * Descanso padrão (segundos) usado quando o exercício não define um
   * descanso específico (`WorkoutExercisePlan.restSeconds`).
   */
  defaultRestSeconds: number;

  /** Notificações de treino ativadas globalmente. */
  notificationsEnabled: boolean;
  /** Som ao finalizar o descanso. */
  soundEnabled: boolean;
  /** Vibração ao finalizar o descanso. */
  vibrationEnabled: boolean;
  /** Avisar quando o descanso terminar. */
  restEndNotificationEnabled: boolean;
  /** Dias da semana com lembrete de treino (mesma rotina da Home). */
  reminderDays: WeekDay[];
  /** Horário do lembrete no formato "HH:mm". */
  reminderTime: string | null;
  updatedAt: string;
}

export const DEFAULT_REST_OPTIONS = [30, 45, 60, 90, 120, 180] as const;

export const DEFAULT_TRAINING_SETTINGS: TrainingSettings = {
  defaultRestSeconds: 90,
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  restEndNotificationEnabled: true,
  reminderDays: [],
  reminderTime: null,
  updatedAt: new Date(0).toISOString(),
};

export function createDefaultTrainingSettings(): TrainingSettings {
  return { ...DEFAULT_TRAINING_SETTINGS, updatedAt: new Date().toISOString() };
}
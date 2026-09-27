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
  /** Horário habitual de treino no formato "HH:mm" (ex: "18:00"). */
  habitualTrainingTime: string;
  /** Lembrete T-2h: Preparatório leve (hidratação e refeição pré-treino). */
  notifyTMinus2h: boolean;
  /** Lembrete T-15m: Chamada curta pré-treino ("A barra tá te esperando"). */
  notifyTMinus15m: boolean;
  /** Lembrete T+30m: Cobrança com humor se ainda não iniciou o treino. */
  notifyTPlus30m: boolean;
  /** Lembrete Fim do dia: Alerta de streak em risco em dia programado. */
  notifyEndOfDayStreakRisk: boolean;
  /** Horário do lembrete de fim do dia ("HH:mm", ex: "21:00"). */
  endOfDayTime: string;
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
  reminderTime: '18:00',
  habitualTrainingTime: '18:00',
  notifyTMinus2h: true,
  notifyTMinus15m: true,
  notifyTPlus30m: true,
  notifyEndOfDayStreakRisk: true,
  endOfDayTime: '21:00',
  updatedAt: new Date(0).toISOString(),
};

export function createDefaultTrainingSettings(): TrainingSettings {
  return { ...DEFAULT_TRAINING_SETTINGS, updatedAt: new Date().toISOString() };
}
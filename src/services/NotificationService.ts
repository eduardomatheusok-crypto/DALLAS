import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { trainingSettingsService } from './TrainingSettingsService';
import { workoutLogService } from './WorkoutLogService';
import { storage } from '../storage';
import type { WorkoutLog } from '../models';
import type { WeekDay, UserTrainingPreferences } from '../models/UserTrainingPreferences';

export type ReminderStage = 't_minus_2h' | 't_minus_15m' | 't_plus_30m' | 'end_of_day';

export interface ScheduledReminder {
  id: string;
  stage: ReminderStage;
  scheduledTime: string; // "HH:mm"
  title: string;
  body: string;
  isRestDay: boolean;
  isCompletedToday: boolean;
  shouldDeliver: boolean;
}

const WEEK_DAY_MAP: Record<number, WeekDay> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

class NotificationService {
  private activeTimeouts: any[] = [];
  private listeners: ((reminder: ScheduledReminder) => void)[] = [];

  /**
   * Converte "HH:mm" e offset em minutos em novo "HH:mm".
   */
  private computeTimeWithOffset(baseTime: string, offsetMinutes: number): string {
    const [h, m] = baseTime.split(':').map((v) => parseInt(v, 10) || 0);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + offsetMinutes);
    const newH = String(date.getHours()).padStart(2, '0');
    const newM = String(date.getMinutes()).padStart(2, '0');
    return `${newH}:${newM}`;
  }

  /**
   * Gera a lista completa de lembretes calculados para o dia de hoje.
   */
  async getTodayReminders(): Promise<ScheduledReminder[]> {
    const settings = await trainingSettingsService.get();
    const prefs = await storage.getTrainingPreferences<UserTrainingPreferences>();
    const trainingDays = prefs?.trainingDays ?? [];

    const allLogs = await workoutLogService.getAll();
    const todayStr = new Date().toISOString().slice(0, 10);
    const isCompletedToday = allLogs.some((l) => l.startedAt.slice(0, 10) === todayStr);

    const todayDayOfWeek = WEEK_DAY_MAP[new Date().getDay()];
    const isRestDay = !trainingDays.includes(todayDayOfWeek);
    const habitualTime = settings.habitualTrainingTime || '18:00';
    const endOfDay = settings.endOfDayTime || '21:00';

    const streak = await workoutLogService.getStreak();

    const reminders: ScheduledReminder[] = [
      {
        id: 'reminder_t_minus_2h',
        stage: 't_minus_2h',
        scheduledTime: this.computeTimeWithOffset(habitualTime, -120),
        title: 'Preparatório DALLAS',
        body: `Seu treino está programado para as ${habitualTime}. Hidrate-se e prepare sua refeição.`,
        isRestDay,
        isCompletedToday,
        shouldDeliver:
          settings.notificationsEnabled &&
          settings.notifyTMinus2h &&
          !isRestDay &&
          !isCompletedToday,
      },
      {
        id: 'reminder_t_minus_15m',
        stage: 't_minus_15m',
        scheduledTime: this.computeTimeWithOffset(habitualTime, -15),
        title: 'Chamada DALLAS',
        body: 'Hora de ir. A barra tá te esperando!',
        isRestDay,
        isCompletedToday,
        shouldDeliver:
          settings.notificationsEnabled &&
          settings.notifyTMinus15m &&
          !isRestDay &&
          !isCompletedToday,
      },
      {
        id: 'reminder_t_plus_30m',
        stage: 't_plus_30m',
        scheduledTime: this.computeTimeWithOffset(habitualTime, 30),
        title: 'Dallas tá de olho',
        body: 'Passou da hora... Dallas tá de olho no seu streak. Vai deixar passar?',
        isRestDay,
        isCompletedToday,
        shouldDeliver:
          settings.notificationsEnabled &&
          settings.notifyTPlus30m &&
          !isRestDay &&
          !isCompletedToday,
      },
      {
        id: 'reminder_end_of_day',
        stage: 'end_of_day',
        scheduledTime: endOfDay,
        title: 'Streak em risco!',
        body:
          streak > 0
            ? `Seu streak de ${streak} treinos cai se você não registrar hoje! Ainda dá tempo.`
            : 'Seu treino de hoje ainda não foi registrado! Não perca o ritmo.',
        isRestDay,
        isCompletedToday,
        shouldDeliver:
          settings.notificationsEnabled &&
          settings.notifyEndOfDayStreakRisk &&
          !isRestDay &&
          !isCompletedToday,
      },
    ];

    return reminders;
  }

  /**
   * Dispara um lembrete (via Web Notifications API se no navegador, com haptic e ouvintes).
   */
  async dispatchNotification(title: string, body: string): Promise<void> {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      }
    }
  }

  /**
   * Dispara um teste imediato de qualquer uma das notificações progressivas.
   */
  async triggerTestNotification(stage: ReminderStage): Promise<ScheduledReminder | null> {
    const list = await this.getTodayReminders();
    const item = list.find((r) => r.stage === stage);
    if (item) {
      await this.dispatchNotification(item.title, item.body);
      this.listeners.forEach((cb) => cb(item));
      return item;
    }
    return null;
  }

  /**
   * Pede permissão explícita no navegador / dispositivo.
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return true;
  }

  /**
   * Inscreve um ouvinte para receber notificações ativas no app.
   */
  addListener(listener: (reminder: ScheduledReminder) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const notificationService = new NotificationService();

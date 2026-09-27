import { storage } from '../storage';
import type { WorkoutLog } from '../models';
import type { UserTrainingPreferences } from '../models/UserTrainingPreferences';

export type AchievementCategory =
  | 'Primeiros Passos'
  | 'Consistência e Hábitos'
  | 'Desempenho e Superação'
  | 'Situações e Desafios';

export interface Achievement {
  id: string;
  name: string;
  category: AchievementCategory;
  triggerDescription: string;
  modalText: string;
  icon: string; // ícone do tema
  badgeColor: string;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // 1. Primeiros Passos
  {
    id: 'PRIMEIRO_PASSO',
    name: 'Primeiro Passo',
    category: 'Primeiros Passos',
    triggerDescription: 'Finalizar o 1º treino no app.',
    modalText: 'A jornada começou! Você deu o passo mais difícil.',
    icon: 'trophy',
    badgeColor: '#FF1E27',
  },
  {
    id: 'NO_RITMO',
    name: 'No Ritmo',
    category: 'Primeiros Passos',
    triggerDescription: 'Finalizar 3 treinos no total.',
    modalText: 'Pegando o embalo! Três treinos na conta.',
    icon: 'flame',
    badgeColor: '#FF5E00',
  },
  {
    id: 'PRIMEIRA_SEMANA_PAGA',
    name: 'Primeira Semana Paga',
    category: 'Primeiros Passos',
    triggerDescription: 'Treinar em 3 dias diferentes na mesma semana.',
    modalText: 'Semana concluída com sucesso e disciplina.',
    icon: 'checkCircle',
    badgeColor: '#10B981',
  },

  // 2. Consistência e Hábitos
  {
    id: 'SEMANA_BLINDADA',
    name: 'Semana Blindada',
    category: 'Consistência e Hábitos',
    triggerDescription: 'Completar a meta semanal de treinos pela primeira vez.',
    modalText: 'Foco total! Você bateu a sua meta da semana.',
    icon: 'shield',
    badgeColor: '#3B82F6',
  },
  {
    id: 'CHAMA_ACESA',
    name: 'Chama Acesa',
    category: 'Consistência e Hábitos',
    triggerDescription: 'Cumprir 7 treinos programados consecutivos sem faltar.',
    modalText: 'Uma sequência de compromissos cumpridos sem quebrar o ritmo!',
    icon: 'flame',
    badgeColor: '#FF1E27',
  },
  {
    id: 'HABITO_DE_FERRO',
    name: 'Hábito de Ferro',
    category: 'Consistência e Hábitos',
    triggerDescription: 'Concluir 30 treinos no total.',
    modalText: 'Não é mais sorte, virou rotina de respeito.',
    icon: 'dumbbell',
    badgeColor: '#8B5CF6',
  },
  {
    id: 'CENTURIAO',
    name: 'Centurião',
    category: 'Consistência e Hábitos',
    triggerDescription: 'Concluir 100 treinos no app.',
    modalText: 'Marca histórica! 100 sessões superadas.',
    icon: 'star',
    badgeColor: '#F59E0B',
  },

  // 3. Desempenho e Superação
  {
    id: 'NOVO_LIMITE',
    name: 'Novo Limite',
    category: 'Desempenho e Superação',
    triggerDescription: 'Bater um recorde pessoal de carga ou repetições.',
    modalText: 'Mais forte do que ontem! Recorde superado.',
    icon: 'trendingUp',
    badgeColor: '#EC4899',
  },
  {
    id: 'TONELADA_CLUBE',
    name: 'Tonelada Clube',
    category: 'Desempenho e Superação',
    triggerDescription: 'Acumular 1.000 kg de volume total levantado.',
    modalText: 'Uma tonelada já ficou para trás. Continue erguendo!',
    icon: 'weight',
    badgeColor: '#6366F1',
  },
  {
    id: 'CARGA_PESADA',
    name: 'Carga Pesada',
    category: 'Desempenho e Superação',
    triggerDescription: 'Acumular 10.000 kg de volume somado.',
    modalText: 'Volume monstruoso! Seus músculos agradecem.',
    icon: 'trophy',
    badgeColor: '#D97706',
  },
  {
    id: 'FOCO_TOTAL',
    name: 'Foco Total',
    category: 'Desempenho e Superação',
    triggerDescription: 'Concluir 100% dos exercícios e séries propostos.',
    modalText: 'Nenhuma série pulada. Execução impecável!',
    icon: 'checkCircle',
    badgeColor: '#10B981',
  },

  // 4. Situações e Desafios
  {
    id: 'MADRUGADOR',
    name: 'Madrugador',
    category: 'Situações e Desafios',
    triggerDescription: 'Concluir um treino antes das 07:00.',
    modalText: 'O treino foi pago antes da maioria acordar!',
    icon: 'time',
    badgeColor: '#06B6D4',
  },
  {
    id: 'TURNO_DA_NOITE',
    name: 'Turno da Noite',
    category: 'Situações e Desafios',
    triggerDescription: 'Concluir um treino após as 21:00.',
    modalText: 'Sem desculpas no fim do dia. Missão cumprida!',
    icon: 'moon',
    badgeColor: '#64748B',
  },
  {
    id: 'GUERREIRO_DO_FIM_DE_SEMANA',
    name: 'Guerreiro do Fim de Semana',
    category: 'Situações e Desafios',
    triggerDescription: 'Concluir um treino no sábado ou domingo.',
    modalText: 'Fim de semana também é dia de evolução.',
    icon: 'calendar',
    badgeColor: '#F97316',
  },
  {
    id: 'INIMIGO_DO_FERIADO',
    name: 'Inimigo do Feriado',
    category: 'Situações e Desafios',
    triggerDescription: 'Treinar em uma data de feriado nacional.',
    modalText: 'Descanso para quem? Você escolheu o foco.',
    icon: 'flame',
    badgeColor: '#EF4444',
  },
  {
    id: 'DIA_DE_PERNA_HONRADO',
    name: 'Dia de Perna Honrado',
    category: 'Situações e Desafios',
    triggerDescription: 'Concluir treino de pernas sem pular nenhuma série.',
    modalText: 'Respeitou o leg day! Amanhã a escada vai cobrar.',
    icon: 'dumbbell',
    badgeColor: '#DC2626',
  },
];

export const getAchievementsStorageKey = (userId?: string | null): string => {
  if (userId && userId.trim()) {
    return `@dallas/achievements/${userId.trim()}`;
  }
  return '@dallas/achievements/anonymous';
};

export class AchievementService {
  async getUserAchievements(userId?: string | null): Promise<UserAchievement[]> {
    try {
      let resolvedId = userId;
      if (!resolvedId) {
        const user = await storage.getUser();
        resolvedId = user?.id ?? null;
      }
      if (!resolvedId) return [];
      const key = getAchievementsStorageKey(resolvedId);
      const raw = await storage.getCustom<UserAchievement[]>(key, []);
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  async saveUserAchievements(list: UserAchievement[], userId?: string | null): Promise<void> {
    let resolvedId = userId;
    if (!resolvedId) {
      const user = await storage.getUser();
      resolvedId = user?.id ?? null;
    }
    if (!resolvedId) return;
    const key = getAchievementsStorageKey(resolvedId);
    await storage.setCustom(key, list);
  }

  async clearUserAchievements(userId: string): Promise<void> {
    if (!userId) return;
    const key = getAchievementsStorageKey(userId);
    await storage.setCustom(key, []);
  }

  /**
   * Avalia todas as regras de conquistas após a finalização de um treino
   * e retorna a lista de conquistas RECÉM-DESBLOQUEADAS nesta sessão para o usuário autenticado.
   */
  async evaluateOnWorkoutComplete(params: {
    userId?: string | null;
    allLogs: WorkoutLog[];
    currentLog: WorkoutLog;
    userPrefs?: UserTrainingPreferences | null;
    currentStreak: number;
    hasPR?: boolean;
    isLegDay?: boolean;
  }): Promise<Achievement[]> {
    let resolvedId = params.userId;
    if (!resolvedId) {
      const user = await storage.getUser();
      resolvedId = user?.id ?? null;
    }
    const existing = await this.getUserAchievements(resolvedId);
    const existingIds = new Set(existing.map((a) => a.achievementId));
    const now = new Date();
    const currentHour = now.getHours();
    const currentDayOfWeek = now.getDay(); // 0 = dom, 6 = sab

    const newlyUnlockedIds: string[] = [];

    // Filtra logs para garantir que somente os logs deste usuário contam para suas conquistas
    const userLogs = resolvedId
      ? params.allLogs.filter((l) => !l.ownerId || l.ownerId === resolvedId)
      : params.allLogs;

    const totalLogsCount = userLogs.length;
    const totalVolume = userLogs.reduce((acc, l) => acc + (l.totalVolume || 0), 0);

    // 1. Primeiro Passo (1º treino)
    if (totalLogsCount >= 1 && !existingIds.has('PRIMEIRO_PASSO')) {
      newlyUnlockedIds.push('PRIMEIRO_PASSO');
    }

    // 2. No Ritmo (3 treinos no total)
    if (totalLogsCount >= 3 && !existingIds.has('NO_RITMO')) {
      newlyUnlockedIds.push('NO_RITMO');
    }

    // 3. Primeira Semana Paga (3 dias diferentes na mesma semana)
    if (!existingIds.has('PRIMEIRA_SEMANA_PAGA')) {
      const oneWeekAgo = Date.now() - 7 * 86400000;
      const recentLogs = userLogs.filter(
        (l) => new Date(l.startedAt).getTime() >= oneWeekAgo,
      );
      const uniqueDays = new Set(
        recentLogs.map((l) => new Date(l.startedAt).toDateString()),
      );
      if (uniqueDays.size >= 3) {
        newlyUnlockedIds.push('PRIMEIRA_SEMANA_PAGA');
      }
    }

    // 4. Semana Blindada (Completar meta semanal de treinos)
    if (!existingIds.has('SEMANA_BLINDADA') && params.userPrefs?.exactFrequency) {
      const oneWeekAgo = Date.now() - 7 * 86400000;
      const thisWeekLogs = userLogs.filter(
        (l) => new Date(l.startedAt).getTime() >= oneWeekAgo,
      );
      const uniqueDays = new Set(
        thisWeekLogs.map((l) => new Date(l.startedAt).toDateString()),
      );
      if (uniqueDays.size >= params.userPrefs.exactFrequency) {
        newlyUnlockedIds.push('SEMANA_BLINDADA');
      }
    }

    // 5. Chama Acesa (7 treinos programados consecutivos)
    if (params.currentStreak >= 7 && !existingIds.has('CHAMA_ACESA')) {
      newlyUnlockedIds.push('CHAMA_ACESA');
    }

    // 6. Hábito de Ferro (30 treinos no total)
    if (totalLogsCount >= 30 && !existingIds.has('HABITO_DE_FERRO')) {
      newlyUnlockedIds.push('HABITO_DE_FERRO');
    }

    // 7. Centurião (100 treinos)
    if (totalLogsCount >= 100 && !existingIds.has('CENTURIAO')) {
      newlyUnlockedIds.push('CENTURIAO');
    }

    // 8. Novo Limite (PR)
    if (params.hasPR && !existingIds.has('NOVO_LIMITE')) {
      newlyUnlockedIds.push('NOVO_LIMITE');
    }

    // 9. Tonelada Clube (1.000 kg acumulados)
    if (totalVolume >= 1000 && !existingIds.has('TONELADA_CLUBE')) {
      newlyUnlockedIds.push('TONELADA_CLUBE');
    }

    // 10. Carga Pesada (10.000 kg acumulados)
    if (totalVolume >= 10000 && !existingIds.has('CARGA_PESADA')) {
      newlyUnlockedIds.push('CARGA_PESADA');
    }

    // 11. Foco Total (100% dos exercícios e séries concluídos)
    if (!existingIds.has('FOCO_TOTAL') && params.currentLog.exercises.length > 0) {
      const allCompleted = params.currentLog.exercises.every((ex) =>
        ex.sets.every((s) => s.completed),
      );
      if (allCompleted) {
        newlyUnlockedIds.push('FOCO_TOTAL');
      }
    }

    // 12. Madrugador (< 07:00)
    if (currentHour < 7 && !existingIds.has('MADRUGADOR')) {
      newlyUnlockedIds.push('MADRUGADOR');
    }

    // 13. Turno da Noite (>= 21:00)
    if (currentHour >= 21 && !existingIds.has('TURNO_DA_NOITE')) {
      newlyUnlockedIds.push('TURNO_DA_NOITE');
    }

    // 14. Guerreiro do Fim de Semana (sábado ou domingo)
    if ((currentDayOfWeek === 0 || currentDayOfWeek === 6) && !existingIds.has('GUERREIRO_DO_FIM_DE_SEMANA')) {
      newlyUnlockedIds.push('GUERREIRO_DO_FIM_DE_SEMANA');
    }

    // 15. Inimigo do Feriado (treinar em feriado)
    if (!existingIds.has('INIMIGO_DO_FERIADO')) {
      const holidays = [
        '01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25',
      ];
      const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (holidays.includes(monthDay)) {
        newlyUnlockedIds.push('INIMIGO_DO_FERIADO');
      }
    }

    // 16. Dia de Perna Honrado
    if (params.isLegDay && !existingIds.has('DIA_DE_PERNA_HONRADO')) {
      const allSetsDone = params.currentLog.exercises.every((ex) =>
        ex.sets.every((s) => s.completed),
      );
      if (allSetsDone) {
        newlyUnlockedIds.push('DIA_DE_PERNA_HONRADO');
      }
    }

    if (newlyUnlockedIds.length === 0) {
      return [];
    }

    const updated = [
      ...existing,
      ...newlyUnlockedIds.map((id) => ({
        achievementId: id,
        unlockedAt: new Date().toISOString(),
      })),
    ];
    await this.saveUserAchievements(updated, resolvedId);

    return ACHIEVEMENTS.filter((a) => newlyUnlockedIds.includes(a.id));
  }
}

export const achievementService = new AchievementService();

import React, { useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Card,
  LoadingState,
} from '../components/common';
import { useUser, useWorkouts, useWorkoutLogs, useExercises } from '../hooks';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';
import { formatDate, formatDuration, workoutLogService, findExerciseByIdOrName } from '../services';
import type { WorkoutLog } from '../models';

type Nav = StackNavigationProp<RootStackParamList>;
type ProgressPeriod = 'semana' | 'mes' | 'ano';

const HERO_BG = require('../../assets/images/workout_hero_bg.jpg');

function formatHeaderDate(date: Date): string {
  const days = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ];
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
}

function fmtVol(v: number): string {
  if (v >= 1000) return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
  return `${v} kg`;
}

function getWeekDayProgress(logs: WorkoutLog[]) {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Seg, 6 = Dom
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const trainedDays = new Set<number>();

  for (const log of logs) {
    const logDate = new Date(log.startedAt);
    const diffDays = Math.floor((logDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      trainedDays.add(diffDays);
    }
  }

  return days.map((label, index) => ({
    label,
    index,
    isCompleted: trainedDays.has(index),
    isToday: index === dayOfWeek,
  }));
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const { logs, reload: reloadLogs } = useWorkoutLogs();
  const { exercises } = useExercises();
  const [streak, setStreak] = useState(0);
  const [progressPeriod, setProgressPeriod] = useState<ProgressPeriod>('semana');

  useFocusEffect(
    React.useCallback(() => {
      reloadLogs();
      workoutLogService.getStreak().then(setStreak).catch(() => {});
    }, [reloadLogs]),
  );

  const todayWorkout = useMemo(
    () => (workouts.length > 0 ? workouts[0] : undefined),
    [workouts],
  );

  const firstName = user?.name ? user.name.split(' ')[0] : 'Eduardo';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia,' : hour < 18 ? 'Boa tarde,' : 'Boa noite,';
  const currentDateStr = useMemo(() => formatHeaderDate(new Date()), []);

  const exerciseCount = todayWorkout?.exercises.length ?? 0;
  const estimatedMinutes = exerciseCount * 10 || 30;

  // Extrai os grupos musculares do treino de hoje
  const todayMuscles = useMemo(() => {
    if (!todayWorkout) return 'Geral';
    const set = new Set<string>();
    todayWorkout.exercises.forEach((we) => {
      const ex = findExerciseByIdOrName(exercises, we.exerciseId);
      if (ex?.muscleGroup) set.add(ex.muscleGroup);
    });
    return set.size > 0 ? Array.from(set).join(' • ') : 'Peito • Costas • Ombros';
  }, [todayWorkout, exercises]);

  // Dias da semana e treinos concluídos na semana
  const weekDays = useMemo(() => getWeekDayProgress(logs), [logs]);
  const completedThisWeekCount = useMemo(
    () => weekDays.filter((d) => d.isCompleted).length,
    [weekDays],
  );

  // Volume filtrado por período
  const periodStats = useMemo(() => {
    const now = new Date();
    let filtered = logs;

    if (progressPeriod === 'semana') {
      const dayOfWeek = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      monday.setHours(0, 0, 0, 0);
      filtered = logs.filter((l) => new Date(l.startedAt) >= monday);
    } else if (progressPeriod === 'mes') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = logs.filter((l) => new Date(l.startedAt) >= firstOfMonth);
    } else {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      filtered = logs.filter((l) => new Date(l.startedAt) >= firstOfYear);
    }

    const volume = filtered.reduce((acc, l) => acc + l.totalVolume, 0);
    return {
      count: filtered.length,
      volume,
    };
  }, [logs, progressPeriod]);

  const recentLogs = useMemo(() => logs.slice(0, 4), [logs]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {workoutsLoading ? (
        <LoadingState />
      ) : (
        <>
          {/* Header Superior com Saudação e Notificações */}
          <View style={styles.topHeader}>
            <View style={styles.greetingWrap}>
              <Text style={styles.greetingSub}>{greeting}</Text>
              <Text style={styles.greetingName}>{firstName} 👋</Text>
              <Text style={styles.currentDate}>{currentDateStr}</Text>
            </View>
            <Pressable
              style={styles.bellButton}
              onPress={() => {}}
              hitSlop={10}
            >
              <Icon name="bell" size={22} color="#FFFFFF" />
              <View style={styles.bellBadge} />
            </Pressable>
          </View>

          {/* Card Principal: TREINO DE HOJE */}
          {todayWorkout ? (
            <View style={styles.heroCardContainer}>
              <ImageBackground
                source={HERO_BG}
                style={styles.heroBg}
                imageStyle={styles.heroBgImage}
              >
                <LinearGradient
                  colors={['rgba(10, 10, 12, 0.45)', 'rgba(10, 10, 12, 0.94)']}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroHeaderBadge}>
                    <Icon name="flash" size={13} color={colors.primary} />
                    <Text style={styles.heroBadgeText}>TREINO DE HOJE</Text>
                  </View>

                  <Text style={styles.heroTitle}>{todayWorkout.name}</Text>
                  <Text style={styles.heroSubtitle}>{todayMuscles}</Text>

                  <View style={styles.heroMetaRow}>
                    <View style={styles.heroMetaItem}>
                      <Icon name="dumbbell" size={14} color="#A1A1AA" />
                      <Text style={styles.heroMetaText}>
                        {exerciseCount} exercícios
                      </Text>
                    </View>
                    <View style={styles.heroMetaItem}>
                      <Icon name="clock" size={14} color="#A1A1AA" />
                      <Text style={styles.heroMetaText}>
                        ~{estimatedMinutes} min
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.heroCtaButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      navigation.navigate('ExerciseExecution', {
                        workoutId: todayWorkout.id,
                      })
                    }
                  >
                    <Icon name="play" size="sm" color="#FFFFFF" />
                    <Text style={styles.heroCtaText}>Começar treino</Text>
                  </Pressable>
                </LinearGradient>
              </ImageBackground>
            </View>
          ) : (
            <Card style={styles.emptyWorkoutCard}>
              <View style={styles.emptyIcon}>
                <Icon name="dumbbell" size={24} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>NENHUM TREINO CADASTRADO</Text>
              <Text style={styles.emptyText}>
                Monte sua rotina de musculação e comece seu progresso hoje.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.heroCtaButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => navigation.navigate('WorkoutForm', {})}
              >
                <Icon name="plus" size="sm" color="#FFFFFF" />
                <Text style={styles.heroCtaText}>Criar primeiro treino</Text>
              </Pressable>
            </Card>
          )}

          {/* Banner Compacto de Sequência / Streak */}
          <Pressable
            style={({ pressed }) => [styles.streakCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Evolution' } as any)}
          >
            <View style={styles.streakIconWrap}>
              <Icon name="flame" size={20} color={colors.primary} />
            </View>
            <View style={styles.streakTextWrap}>
              <Text style={styles.streakTitle}>
                {streak > 0
                  ? `${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'}`
                  : 'Comece sua sequência'}
              </Text>
              <Text style={styles.streakSubtitle}>
                Continue treinando para manter sua sequência!
              </Text>
            </View>
            <Icon name="chevronRight" size={16} color="#71717A" />
          </Pressable>

          {/* Seção: SEU PROGRESSO */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>SEU PROGRESSO</Text>
              <View style={styles.segmentedTabsContainer}>
                {(['semana', 'mes', 'ano'] as const).map((period) => {
                  const active = progressPeriod === period;
                  const label =
                    period === 'semana' ? 'Semana' : period === 'mes' ? 'Mês' : 'Ano';
                  return (
                    <Pressable
                      key={period}
                      onPress={() => setProgressPeriod(period)}
                      style={[
                        styles.periodPill,
                        active && styles.periodPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodPillText,
                          active && styles.periodPillTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 3 Métricas em Linha */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Icon name="dumbbell" size={16} color={colors.primary} />
                </View>
                <Text style={styles.metricValue}>{periodStats.count}</Text>
                <Text style={styles.metricLabel}>
                  {progressPeriod === 'semana'
                    ? 'Treinos esta semana'
                    : progressPeriod === 'mes'
                    ? 'Treinos este mês'
                    : 'Treinos este ano'}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Icon name="flame" size={16} color={colors.primary} />
                </View>
                <Text style={styles.metricValue}>
                  {fmtVol(periodStats.volume).replace(' kg', '')}
                  <Text style={styles.metricUnit}> kg</Text>
                </Text>
                <Text style={styles.metricLabel}>Volume total</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Icon name="flame" size={16} color={colors.primary} />
                </View>
                <Text style={styles.metricValue}>{streak}</Text>
                <Text style={styles.metricLabel}>Dias seguidos</Text>
              </View>
            </View>

            {/* Tracker Semanal de Dias */}
            <View style={styles.weekTrackerCard}>
              <View style={styles.weekTrackerHeader}>
                <Text style={styles.weekTrackerTitle}>Treinos esta semana</Text>
                <Text style={styles.weekTrackerCount}>
                  {completedThisWeekCount}/7 concluídos
                </Text>
              </View>

              <View style={styles.weekBarsRow}>
                {weekDays.map((d) => (
                  <View key={d.label} style={styles.dayCol}>
                    <View
                      style={[
                        styles.dayBar,
                        d.isCompleted && styles.dayBarCompleted,
                      ]}
                    />
                    <Text
                      style={[
                        styles.dayText,
                        d.isCompleted && styles.dayTextCompleted,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Seção: ATIVIDADE RECENTE */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>ATIVIDADE RECENTE</Text>
              <Pressable
                onPress={() => navigation.navigate('MainTabs', { screen: 'Evolution' } as any)}
                hitSlop={10}
              >
                <Text style={styles.seeHistoryText}>Ver histórico {'->'}</Text>
              </Pressable>
            </View>

            {recentLogs.length > 0 ? (
              <View style={styles.recentList}>
                {recentLogs.map((log) => (
                  <Pressable
                    key={log.id}
                    style={({ pressed }) => [
                      styles.recentItemCard,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => navigation.navigate('LogDetail', { logId: log.id })}
                  >
                    <View style={styles.recentCheckCircle}>
                      <Icon name="check" size={12} color="#FFFFFF" />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentName} numberOfLines={1}>
                        {log.workoutName}
                      </Text>
                      <Text style={styles.recentMeta}>
                        {formatDate(log.startedAt)} • {formatDuration(log.durationSeconds)} • {fmtVol(log.totalVolume)}
                      </Text>
                    </View>
                    <Icon name="chevronRight" size={16} color="#71717A" />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.emptyRecentCard}>
                <Text style={styles.emptyRecentText}>
                  Nenhum treino concluído recentemente.
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 40,
  },
  pressed: {
    opacity: 0.86,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingWrap: {
    flex: 1,
  },
  greetingSub: {
    ...typography.caption,
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  currentDate: {
    ...typography.caption,
    color: '#71717A',
    fontSize: 13,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161618',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#26262A',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  heroCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#26262A',
    marginBottom: 14,
    backgroundColor: '#121214',
  },
  heroBg: {
    width: '100%',
  },
  heroBgImage: {
    resizeMode: 'cover',
    borderRadius: 20,
  },
  heroGradient: {
    padding: 20,
  },
  heroHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    ...typography.body,
    color: '#D4D4D8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 14,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '500',
  },
  heroCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyWorkoutCard: {
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#26262A',
    marginBottom: 14,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 30, 39, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#26262A',
    marginBottom: 22,
  },
  streakIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 30, 39, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  streakTextWrap: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  seeHistoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  segmentedTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#242428',
  },
  periodPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  periodPillActive: {
    backgroundColor: colors.primary,
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  periodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#141416',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242428',
  },
  metricIconBox: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  metricLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    lineHeight: 14,
    fontWeight: '500',
  },
  weekTrackerCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242428',
  },
  weekTrackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekTrackerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  weekTrackerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  weekBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayBar: {
    width: 32,
    height: 48,
    backgroundColor: '#1F1F24',
    borderRadius: 8,
    marginBottom: 8,
  },
  dayBarCompleted: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
  },
  dayTextCompleted: {
    color: '#FFFFFF',
  },
  recentList: {
    gap: 8,
  },
  recentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#222226',
  },
  recentCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E382B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyRecentCard: {
    backgroundColor: '#141416',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242428',
    alignItems: 'center',
  },
  emptyRecentText: {
    color: '#71717A',
    fontSize: 13,
  },
});
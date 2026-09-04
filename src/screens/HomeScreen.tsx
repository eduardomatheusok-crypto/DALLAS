import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Card,
  EmptyState,
  LoadingState,
  Section,
  IconButton,
} from '../components/common';
import { useUser, useWorkouts, useWorkoutLogs } from '../hooks';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Icon, type AppIconName } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';
import { formatDate, formatDuration, workoutLogService } from '../services';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const { logs, reload: reloadLogs } = useWorkoutLogs();
  const [streak, setStreak] = useState(0);

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

  const firstName = user?.name.split(' ')[0] ?? 'Atleta';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const exerciseCount = todayWorkout?.exercises.length ?? 0;
  const estimatedMinutes = exerciseCount * 10;

  const totalVolume = useMemo(
    () => logs.reduce((acc, l) => acc + l.totalVolume, 0),
    [logs],
  );

  const recent = logs.slice(0, 3);
  const evolution = useMemo(() => buildEvolution(logs), [logs]);

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
          <Header firstName={firstName} greeting={greeting} streak={streak} />

          {todayWorkout ? (
            <TodayWorkout
              name={todayWorkout.name}
              exerciseCount={exerciseCount}
              minutes={estimatedMinutes}
              onStart={() =>
                navigation.navigate('ExerciseExecution', { workoutId: todayWorkout.id })
              }
            />
          ) : (
            <Card style={styles.emptyWorkout}>
              <View style={styles.emptyIcon}>
                <Icon name="dumbbell" size={20} color={colors.text} />
              </View>
              <Text style={[typography.subtitle, styles.emptyWorkoutTitle]}>
                NENHUM TREINO AINDA
              </Text>
              <Text style={[typography.bodySecondary, styles.emptyWorkoutText]}>
                Monte sua primeira rotina e comece a acompanhar sua evolução.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
                onPress={() => navigation.navigate('WorkoutForm', {})}
              >
                <Icon name="plus" size="sm" color={colors.white} />
                <Text style={styles.emptyCtaText}>Criar treino</Text>
              </Pressable>
            </Card>
          )}

          {logs.length > 0 ? (
            <>
              <Section title="Resumo de hoje">
                <View style={styles.summaryRow}>
                  <SummaryStat
                    icon="flame"
                    value={`${fmtVol(totalVolume)} kg`}
                    label="Volume"
                  />
                  <SummaryStat
                    icon="checkmarkDone"
                    value={`${logs.length}`}
                    label="Treinos"
                  />
                  <SummaryStat
                    icon="calendar"
                    value={logs[0] ? formatDate(logs[0].startedAt).slice(0, 5) : '—'}
                    label="Último"
                    highlight
                  />
                </View>
              </Section>

              {evolution ? (
                <Section title="Evolução" style={styles.sectionSpacing}>
                  <Card style={styles.evolutionCard}>
                    <View style={styles.evolutionTop}>
                      <View style={styles.evolutionIcon}>
                        <Icon name="trendUp" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.body, styles.evolutionName]}>
                          {evolution.name}
                        </Text>
                        <Text style={styles.evolutionMeta}>
                          {evolution.from} kg → {evolution.to} kg
                        </Text>
                      </View>
                      <View style={styles.deltaPill}>
                        <Text style={styles.deltaText}>+{evolution.delta}%</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('ExerciseProgress', {
                          exerciseId: evolution.exerciseId,
                          name: evolution.name,
                        })
                      }
                      style={styles.evolutionLink}
                    >
                      <Text style={styles.seeAll}>Ver progresso</Text>
                      <Icon name="chevronRight" size="xs" color={colors.primary} />
                    </Pressable>
                  </Card>
                </Section>
              ) : null}

              <Section title="Atividade">
                <View style={styles.recentList}>
                  {recent.map((log) => (
                    <Pressable
                      key={log.id}
                      onPress={() => navigation.navigate('LogDetail', { logId: log.id })}
                      style={({ pressed }) => [pressed && styles.pressed]}
                    >
                      <Card style={styles.historyCard}>
                        <View style={styles.historyCheck}>
                          <Icon name="checkmarkDone" size="sm" color={colors.success} />
                        </View>
                        <View style={styles.historyInfo}>
                          <Text style={[typography.body, styles.historyName]} numberOfLines={1}>
                            {log.workoutName}
                          </Text>
                          <Text style={styles.historyMeta}>
                            {formatDate(log.startedAt)} · {formatDuration(log.durationSeconds)}
                          </Text>
                        </View>
                        <Text style={styles.historyVol}>{fmtVol(log.totalVolume)} kg</Text>
                      </Card>
                    </Pressable>
                  ))}
                </View>
              </Section>
            </>
          ) : (
            <Section title="Sua evolução" style={styles.sectionSpacing}>
              <EmptyState
                icon="dumbbell"
                title="SEUS DADOS COMEÇAM AQUI"
                message="Complete seu primeiro treino e acompanhe seu progresso, volume e sequência."
                actionLabel="Bora treinar"
                onAction={() =>
                  navigation.navigate(
                    'WorkoutDetail',
                    todayWorkout ? { workoutId: todayWorkout.id } : ({} as any),
                  )
                }
              />
            </Section>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Header({
  firstName,
  greeting,
  streak,
}: {
  firstName: string;
  greeting: string;
  streak: number;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        <Text style={[typography.heroTitle, styles.greeting]}>
          {greeting}, {firstName}.
        </Text>
      </View>
      <View style={styles.streak}>
        <Icon name="streak" size={16} color={colors.primary} />
        <Text style={styles.streakValue}>{streak}</Text>
        <Text style={styles.streakLabel}>dias</Text>
      </View>
    </View>
  );
}

function TodayWorkout({
  name,
  exerciseCount,
  minutes,
  onStart,
}: {
  name: string;
  exerciseCount: number;
  minutes: number;
  onStart: () => void;
}) {
  return (
    <View style={[styles.today, shadows.card]}>
      <View style={styles.todayLabel}>
        <Icon name="flash" size={11} color={colors.primary} />
        <Text style={styles.todayLabelText}>TREINO DE HOJE</Text>
      </View>
      <Text style={styles.todayName}>{name}</Text>
      <View style={styles.todayMeta}>
        <MetaChip icon="repeat" text={`${exerciseCount} exercícios`} />
        <MetaChip icon="clock" text={`~${minutes} min`} />
      </View>
      <Pressable
        style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
        onPress={onStart}
      >
        <Icon name="play" size="sm" color={colors.white} />
        <Text style={styles.startText}>Começar treino</Text>
      </Pressable>
    </View>
  );
}

function MetaChip({ icon, text }: { icon: AppIconName; text: string }) {
  return (
    <View style={styles.metaChip}>
      <Icon name={icon} size={12} color={colors.textSecondary} />
      <Text style={styles.metaChipText}>{text}</Text>
    </View>
  );
}

function SummaryStat({
  icon,
  value,
  label,
  highlight = false,
}: {
  icon: AppIconName;
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.summaryCard, highlight && styles.summaryHighlight]}>
      <Icon
        name={icon}
        size={14}
        color={highlight ? colors.primary : colors.textSecondary}
      />
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

interface EvolutionHighlight {
  exerciseId: string;
  name: string;
  from: number;
  to: number;
  delta: number;
}

function buildEvolution(
  logs: { exercises: { exerciseId: string; exerciseName: string; sets: { weight: number; completed: boolean; category?: string }[] }[] }[],
): EvolutionHighlight | null {
  const byExercise = new Map<
    string,
    { name: string; weights: number[] }
  >();
  for (const log of logs) {
    for (const ex of log.exercises) {
      const prev = byExercise.get(ex.exerciseId) ?? { name: ex.exerciseName, weights: [] };
      const working = ex.sets
        .filter((s) => s.completed && s.weight > 0 && (s.category ?? 'working') === 'working')
        .map((s) => s.weight);
      if (working.length > 0) {
        prev.weights.push(Math.max(...working));
        byExercise.set(ex.exerciseId, prev);
      }
    }
  }

  let best: EvolutionHighlight | null = null;
  for (const [id, data] of byExercise) {
    if (data.weights.length < 2) continue;
    const first = data.weights[0];
    const last = data.weights[data.weights.length - 1];
    if (first <= 0 || last < first) continue;
    const delta = Math.round(((last - first) / first) * 1000) / 10;
    if (!best || delta > best.delta) {
      best = { exerciseId: id, name: data.name, from: first, to: last, delta };
    }
  }
  return best;
}

function fmtVol(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return `${v}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  greeting: {
    textTransform: 'none',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  streakValue: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  streakLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  today: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  todayLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayLabelText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  todayName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  todayMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 15,
  },
  startText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyWorkout: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyWorkoutTitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyWorkoutText: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.lg,
  },
  emptyCtaText: {
    color: colors.white,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  summaryHighlight: {
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  summaryValueHighlight: {
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  evolutionCard: {
    gap: spacing.md,
  },
  evolutionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  evolutionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evolutionName: {
    fontWeight: '700',
  },
  evolutionMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deltaPill: {
    backgroundColor: colors.scrim,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  deltaText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  evolutionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  seeAll: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  recentList: {
    gap: spacing.md,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  historyCheck: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyName: {
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyVol: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
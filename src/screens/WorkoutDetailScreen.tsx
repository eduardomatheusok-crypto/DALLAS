import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Card, Button, LoadingState, EmptyState, Screen, Section, IconButton } from '../components/common';
import { useWorkouts, useExercises } from '../hooks';
import { colors, spacing, borderRadius, typography, SET_CATEGORY_THEME } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';
import {
  planTotalSets,
  planWorkingSets,
  planWarmupSets,
  planPreparationSets,
  techniqueName,
  type WorkoutExercisePlan,
} from '../models';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = {
  key: string;
  name: string;
  params: { workoutId: string };
};

export default function WorkoutDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { workoutId } = route.params;
  const { workouts, loading } = useWorkouts();
  const { exercises } = useExercises();

  const workout = useMemo(
    () => workouts.find((w) => w.id === workoutId),
    [workouts, workoutId],
  );

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (!workout) {
    return (
      <Screen>
        <EmptyState icon="error" title="Treino não encontrado" />
      </Screen>
    );
  }

  const orderedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);
  const totalSets = orderedExercises.reduce((acc, we) => acc + planTotalSets(we), 0);

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={[typography.overline, styles.heroOverline]}>Seu treino</Text>
          <IconButton
            name="pencil"
            onPress={() => navigation.navigate('WorkoutForm', { workoutId: workout.id })}
            color={colors.textSecondary}
            bg="transparent"
            border={colors.border}
          />
        </View>
        <Text style={styles.heroTitle}>{workout.name}</Text>
        <Text style={styles.heroMeta}>
          {orderedExercises.length} exercícios · {totalSets} séries
        </Text>

        <Pressable
          style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
          onPress={() => navigation.navigate('ExerciseExecution', { workoutId: workout.id })}
        >
          <Icon name="play" size="sm" color={colors.white} />
          <Text style={styles.startText}>Começar treino</Text>
        </Pressable>
      </View>

      <Section title="Resumo">
        <View style={styles.summaryRow}>
          <SummaryBox label="Exercícios" value={`${orderedExercises.length}`} />
          <SummaryBox label="Séries" value={`${totalSets}`} />
          <SummaryBox
            label="Reps ~"
            value={`${orderedExercises[0]?.plannedReps ?? 0}`}
          />
        </View>
      </Section>

      <Section title="Exercícios">
        <View style={styles.exercises}>
          {orderedExercises.map((we, index) => {
            const ex = exercises.find((e) => e.id === we.exerciseId);
            return (
              <Pressable
                key={we.exerciseId}
                style={({ pressed }) => [styles.exerciseRow, pressed && styles.pressed]}
                onPress={() =>
                  navigation.navigate('WorkoutExerciseConfig', {
                    workoutId: workout.id,
                    exerciseId: we.exerciseId,
                  })
                }
              >
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={[typography.body, styles.exerciseName]} numberOfLines={1}>
                      {ex?.name ?? 'Exercício'}
                    </Text>
                    {we.advancedTechnique && we.advancedTechnique.kind !== 'none' ? (
                      <View style={styles.techBadge}>
                        <Text style={styles.techBadgeText}>
                          {techniqueName(we.advancedTechnique.kind)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <SetBreakdown plan={we} />
                </View>
                <Icon name="chevronRight" size="sm" color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </Section>

      <View style={styles.footer}>
        <Button
          title="Editar treino"
          variant="secondary"
          icon="pencil"
          onPress={() => navigation.navigate('WorkoutForm', { workoutId: workout.id })}
          style={styles.footerButton}
        />
      </View>
    </Screen>
  );
}

function SetBreakdown({ plan }: { plan: WorkoutExercisePlan }) {
  const working = planWorkingSets(plan);
  const warmup = planWarmupSets(plan);
  const prep = planPreparationSets(plan);
  const isDefault = warmup === 0 && prep === 0;

  return (
    <View style={styles.breakdownRow}>
      {isDefault ? (
        <Text style={styles.breakdownDefault}>
          {working} séries · {plan.plannedReps} reps
          {plan.initialWeight ? ` · ${plan.initialWeight} kg` : ''}
        </Text>
      ) : (
        <>
          {warmup > 0 ? (
            <BreakdownChip
              label={`${warmup} aquec.`}
              color={SET_CATEGORY_THEME.warmup.accent}
            />
          ) : null}
          {prep > 0 ? (
            <BreakdownChip
              label={`${prep} prep.`}
              color={SET_CATEGORY_THEME.preparation.accent}
            />
          ) : null}
          <BreakdownChip
            label={`${working} válidas`}
            color={SET_CATEGORY_THEME.working.accent}
          />
        </>
      )}
    </View>
  );
}

function BreakdownChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.breakdownChip, { borderColor: color }]}>
      <View style={[styles.breakdownDot, { backgroundColor: color }]} />
      <Text style={[styles.breakdownText, { color }]}>{label}</Text>
    </View>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroOverline: {
    color: colors.textMuted,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  heroMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 15,
    marginTop: spacing.sm,
  },
  startText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  exercises: {
    gap: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  orderText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  exerciseName: {
    fontWeight: '600',
  },
  techBadge: {
    borderRadius: borderRadius.sm,
    backgroundColor: colors.scrim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  techBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  breakdownDefault: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  breakdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  breakdownText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    marginTop: spacing.lg,
  },
  footerButton: {
    width: '100%',
  },
});
import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  LoadingState,
  EmptyState,
  Screen,
  MenuSheet,
  ConfirmationModal,
} from '../components/common';
import { useWorkouts, useExercises } from '../hooks';
import { findExerciseByIdOrName, workoutService } from '../services';
import { colors, spacing, borderRadius } from '../theme';
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
  const { workouts, loading, reload } = useWorkouts();
  const { exercises } = useExercises();

  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const workout = useMemo(
    () => workouts.find((w) => w.id === workoutId),
    [workouts, workoutId],
  );

  if (loading) {
    return (
      <Screen style={styles.screen}>
        <LoadingState />
      </Screen>
    );
  }
  if (!workout) {
    return (
      <Screen style={styles.screen}>
        <EmptyState icon="error" title="Treino não encontrado" />
      </Screen>
    );
  }

  const orderedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);
  const totalSets = orderedExercises.reduce((acc, we) => acc + planTotalSets(we), 0);
  const estimatedMin = Math.round(totalSets * 3.5);

  const muscleList = Array.from(
    new Set(
      orderedExercises
        .map((we) => findExerciseByIdOrName(exercises, we.exerciseId)?.muscleGroup)
        .filter(Boolean) as string[],
    ),
  );

  const confirmDelete = async () => {
    setDeleteVisible(false);
    await workoutService.deleteWorkout(workout.id);
    navigation.goBack();
  };

  const duplicateWorkout = async () => {
    setMenuVisible(false);
    await workoutService.duplicateWorkout(workout.id);
    await reload();
  };

  return (
    <Screen scroll style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Icon name="chevronLeft" size="sm" color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Detalhes do treino</Text>
        <Pressable
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Icon name="menuVertical" size="sm" color={colors.white} />
        </Pressable>
      </View>

      {/* Workout Info Section */}
      <View style={styles.heroSection}>
        <Text style={styles.workoutTitle}>{workout.name}</Text>
        <Text style={styles.workoutMeta}>
          {orderedExercises.length} exercícios • {totalSets} séries • ~{estimatedMin} min
        </Text>

        {/* Muscle Tags */}
        {muscleList.length > 0 ? (
          <View style={styles.muscleRow}>
            {muscleList.map((m) => (
              <View key={m} style={styles.muscleBadge}>
                <Text style={styles.muscleBadgeText}>{m}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Big Red CTA */}
        <Pressable
          style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
          onPress={() => navigation.navigate('ExerciseExecution', { workoutId: workout.id })}
        >
          <Icon name="play" size="sm" color={colors.white} />
          <Text style={styles.startText}>Iniciar treino</Text>
        </Pressable>
      </View>

      {/* Exercises Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exercícios</Text>
      </View>

      <View style={styles.exerciseList}>
        {orderedExercises.map((we) => {
          const ex = findExerciseByIdOrName(exercises, we.exerciseId);
          const thumbUri = ex?.startImage || ex?.gifUrl;

          return (
            <Pressable
              key={we.exerciseId}
              style={({ pressed }) => [styles.exerciseCard, pressed && styles.pressed]}
              onPress={() =>
                navigation.navigate('WorkoutExerciseConfig', {
                  workoutId: workout.id,
                  exerciseId: we.exerciseId,
                })
              }
            >
              {/* Thumbnail */}
              <View style={styles.exerciseThumb}>
                {thumbUri ? (
                  <Image source={{ uri: thumbUri }} style={styles.thumbImage} resizeMode="cover" />
                ) : (
                  <Icon name="dumbbell" size="sm" color="#FF1E27" />
                )}
              </View>

              {/* Info */}
              <View style={styles.exerciseInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.exerciseName} numberOfLines={1}>
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
                <SetSummary plan={we} />
              </View>

              {/* Action Menu / Configure */}
              <Pressable
                onPress={() =>
                  navigation.navigate('WorkoutExerciseConfig', {
                    workoutId: workout.id,
                    exerciseId: we.exerciseId,
                  })
                }
                hitSlop={12}
                style={styles.moreBtn}
              >
                <Icon name="menuVertical" size="xs" color={colors.textSecondary} />
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      {/* Menu Sheet */}
      <MenuSheet
        visible={menuVisible}
        title="Ações do treino"
        onClose={() => setMenuVisible(false)}
        actions={[
          {
            label: 'Editar treino',
            icon: 'pencil',
            onPress: () => {
              setMenuVisible(false);
              navigation.navigate('WorkoutForm', { workoutId: workout.id });
            },
          },
          {
            label: 'Duplicar treino',
            icon: 'duplicate',
            onPress: duplicateWorkout,
          },
          {
            label: 'Excluir treino',
            icon: 'trash',
            destructive: true,
            onPress: () => {
              setMenuVisible(false);
              setDeleteVisible(true);
            },
          },
        ]}
      />

      <ConfirmationModal
        visible={deleteVisible}
        title="Excluir treino?"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </Screen>
  );
}

function SetSummary({ plan }: { plan: WorkoutExercisePlan }) {
  const working = planWorkingSets(plan);
  const warmup = planWarmupSets(plan);
  const prep = planPreparationSets(plan);
  const isDefault = warmup === 0 && prep === 0;

  if (isDefault) {
    return (
      <Text style={styles.exerciseMeta}>
        {working} séries • {plan.plannedReps} reps
        {plan.initialWeight ? ` • ${plan.initialWeight} kg` : ''}
      </Text>
    );
  }

  const parts = [];
  if (warmup > 0) parts.push(`${warmup} aquec.`);
  if (prep > 0) parts.push(`${prep} prep.`);
  parts.push(`${working} válidas`);

  return (
    <Text style={styles.exerciseMeta}>
      {parts.join(' • ')} ({plan.plannedReps} reps)
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0A0A0C',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242428',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  heroSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  workoutMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  muscleBadge: {
    backgroundColor: '#18181B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  muscleBadgeText: {
    fontSize: 12,
    color: '#D4D4D8',
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FF1E27',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  startText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  exerciseList: {
    gap: spacing.sm,
    paddingBottom: 40,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
    gap: spacing.md,
  },
  exerciseThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2E2E34',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  techBadge: {
    borderRadius: 4,
    backgroundColor: 'rgba(255, 30, 39, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  techBadgeText: {
    color: '#FF1E27',
    fontSize: 10,
    fontWeight: '700',
  },
  exerciseMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
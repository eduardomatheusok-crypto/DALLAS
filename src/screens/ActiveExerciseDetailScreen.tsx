import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { ConfirmationModal, LoadingState } from '../components/common';
import Screen from '../components/common/Screen';
import { useWorkoutSession, useExercises, useRestTimer, useWorkouts } from '../hooks';
import { findExerciseByIdOrName, playTimerEndSound, resolveCanonicalName } from '../services';
import { CURATED_EXERCISES } from '../data/curatedExercises';
import { colors, spacing, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import RestTimerOverlay from '../components/workout/RestTimerOverlay';
import { ExerciseMediaViewer, ExerciseDetailModal, DallasExerciseTip } from '../components/exercise';
import type { RootStackParamList } from '../navigation/types';
import type { Exercise } from '../models';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = {
  key: string;
  name: string;
  params: { workoutId: string; exerciseId: string; exerciseIndex?: number };
};

export default function ActiveExerciseDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { workoutId, exerciseId } = route.params;

  const { workouts } = useWorkouts();
  const workout = useMemo(() => workouts.find((w) => w.id === workoutId), [workouts, workoutId]);

  const {
    exercises: execExercises,
    lastResults,
    toggleExerciseCompleted,
    toggleSetCompleted,
    updateSet,
    bumpWeight,
    addSet,
    finishSession,
  } = useWorkoutSession();

  const { exercises: catalogExercises } = useExercises();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);

  // Hook do cronômetro de descanso
  const restTimer = useRestTimer({
    onEnd: (reason) => {
      if (reason === 'finished') {
        playTimerEndSound();
      }
    },
  });

  const exerciseIndex = useMemo(
    () => execExercises.findIndex((e) => e.exerciseId === exerciseId),
    [execExercises, exerciseId],
  );

  const currentExec = exerciseIndex !== -1 ? execExercises[exerciseIndex] : null;
  const nextExec = exerciseIndex !== -1 && exerciseIndex < execExercises.length - 1 ? execExercises[exerciseIndex + 1] : null;

  const catalogExercise = useMemo<Exercise | null>(() => {
    if (!currentExec) return null;
    const found = findExerciseByIdOrName(catalogExercises, currentExec.exerciseId, currentExec.exerciseName);
    if (found) return found;
    const c = CURATED_EXERCISES.find(
      (item) =>
        item.name.toLowerCase() === currentExec.exerciseName.toLowerCase() ||
        resolveCanonicalName(item.name).toLowerCase() === resolveCanonicalName(currentExec.exerciseName).toLowerCase() ||
        resolveCanonicalName(item.name).toLowerCase() === resolveCanonicalName(currentExec.exerciseId).toLowerCase(),
    );
    if (c) {
      return {
        id: currentExec.exerciseId,
        name: c.name,
        muscleGroup: c.muscleGroup,
        equipment: c.equipment,
        secondaryMuscles: c.secondaryMuscles,
        startImage: c.startImage,
        endImage: c.endImage,
        steps: c.steps,
        instructions: c.instructions,
        dallasTip: c.dallasTip,
        isCustom: false,
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }, [catalogExercises, currentExec]);

  const nextCatalogExercise = useMemo<Exercise | null>(() => {
    if (!nextExec) return null;
    return findExerciseByIdOrName(catalogExercises, nextExec.exerciseId, nextExec.exerciseName) || null;
  }, [catalogExercises, nextExec]);

  const hasNext = exerciseIndex >= 0 && exerciseIndex < execExercises.length - 1;

  const goToExerciseByIndex = (idx: number) => {
    if (idx < 0 || idx >= execExercises.length) return;
    const target = execExercises[idx];
    navigation.replace('ActiveExerciseDetail', {
      workoutId,
      exerciseId: target.exerciseId,
      exerciseIndex: idx,
    });
  };

  const handleFinishCurrent = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (currentExec) {
      if (!currentExec.completed) {
        toggleExerciseCompleted(currentExec.exerciseId);
      }
    }
    if (hasNext) {
      goToExerciseByIndex(exerciseIndex + 1);
    } else {
      setFinishModalVisible(true);
    }
  };

  const handleToggleSet = (setId: string) => {
    if (!currentExec) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleSetCompleted(currentExec.exerciseId, setId);
    const set = currentExec.sets.find((s) => s.id === setId);
    if (set && !set.completed) {
      // Start rest timer
      restTimer.start({
        id: `rest-${setId}`,
        durationSeconds: 60,
        title: 'Descanso',
        subtitle: currentExec.exerciseName,
      });
    }
  };

  const handleConfirmFinishWorkout = async () => {
    setFinishModalVisible(false);
    await finishSession();
    navigation.navigate('MainTabs', { screen: 'Evolution' });
  };

  if (!currentExec) {
    return (
      <Screen style={styles.screen}>
        <LoadingState label="Exercício não encontrado na sessão" />
      </Screen>
    );
  }

  const lastResult = lastResults.get(currentExec.exerciseId);
  const muscle = catalogExercise?.muscleGroup || currentExec.muscleGroup;
  const equip = catalogExercise?.equipment;
  const subtitle = [muscle, equip].filter(Boolean).join(' • ');
  const displayName = catalogExercise?.name || (currentExec.exerciseName !== 'Exercício' ? currentExec.exerciseName : 'Exercício');

  const totalExercises = execExercises.length;
  const progressRatio = totalExercises > 0 ? (exerciseIndex + 1) / totalExercises : 0;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Icon name="chevronLeft" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerWorkoutInfo}>
            <Text style={styles.workoutName}>{workout?.name ?? 'TREINO EM ANDAMENTO'}</Text>
            <Text style={styles.workoutSub}>
              {totalExercises} exercícios • {currentExec.sets.length} séries
            </Text>
          </View>

          <Pressable
            style={styles.bellButton}
            onPress={() => setDetailModalVisible(true)}
            hitSlop={12}
          >
            <Icon name="bell" size={20} color="#FF1E27" />
          </Pressable>
        </View>

        {/* Progress Bar Row */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {exerciseIndex + 1}/{totalExercises}
          </Text>
        </View>
      </View>

      {/* Cronômetro Overlay */}
      {restTimer.active && restTimer.data ? (
        <RestTimerOverlay
          remainingMs={restTimer.remainingMs}
          totalMs={restTimer.totalMs}
          title={restTimer.data.title}
          subtitle={restTimer.data.subtitle}
          paused={restTimer.paused}
          onPause={restTimer.pause}
          onResume={restTimer.resume}
          onSkip={restTimer.skip}
        />
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Active Exercise Card */}
        <View style={styles.activeCard}>
          {/* Exercise Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.exerciseIconBadge}>
                {catalogExercise?.startImage ? (
                  <Image source={{ uri: catalogExercise.startImage }} style={styles.iconBadgeImg} />
                ) : (
                  <Icon name="dumbbell" size="sm" color="#FF1E27" />
                )}
              </View>
              <View style={styles.cardHeaderTitles}>
                <Text style={styles.exerciseTitle} numberOfLines={1}>
                  {displayName}
                </Text>
                {subtitle ? <Text style={styles.exerciseSub}>{subtitle}</Text> : null}
              </View>
            </View>

            <Pressable
              style={styles.videoBtn}
              onPress={() => setDetailModalVisible(true)}
              hitSlop={10}
            >
              <Icon name="play" size={16} color="#FF1E27" />
            </Pressable>
          </View>

          {/* Exercise Illustration/Media */}
          {catalogExercise?.startImage ? (
            <View style={styles.mediaContainer}>
              <ExerciseMediaViewer
                startImage={catalogExercise.startImage}
                endImage={catalogExercise.endImage}
                autoAnimate
              />
            </View>
          ) : null}

          {/* Dallas Tip if available */}
          {catalogExercise?.dallasTip ? (
            <View style={styles.tipWrap}>
              <DallasExerciseTip tip={catalogExercise.dallasTip} />
            </View>
          ) : null}

          {/* Sets List Table */}
          <View style={styles.setsList}>
            {currentExec.sets.map((s, idx) => {
              const isFirstPending = !s.completed && currentExec.sets.findIndex((x) => !x.completed) === idx;

              return (
                <View
                  key={s.id}
                  style={[
                    styles.setRow,
                    isFirstPending && styles.setRowActive,
                    s.completed && styles.setRowCompleted,
                  ]}
                >
                  {/* Set Number */}
                  <View style={[styles.setNumBadge, (isFirstPending || s.completed) && styles.setNumBadgeActive]}>
                    <Text style={[styles.setNumText, (isFirstPending || s.completed) && styles.setNumTextActive]}>
                      {s.setNumber}
                    </Text>
                  </View>

                  {/* Weight Stepper */}
                  <View style={styles.statBox}>
                    <Pressable
                      style={styles.stepperMiniBtn}
                      onPress={() => bumpWeight(currentExec.exerciseId, s.id, -2.5)}
                    >
                      <Text style={styles.stepperMiniText}>-</Text>
                    </Pressable>
                    <Text style={styles.statValue}>{s.weight} kg</Text>
                    <Pressable
                      style={styles.stepperMiniBtn}
                      onPress={() => bumpWeight(currentExec.exerciseId, s.id, 2.5)}
                    >
                      <Text style={styles.stepperMiniText}>+</Text>
                    </Pressable>
                  </View>

                  {/* Reps Stepper */}
                  <View style={styles.statBox}>
                    <Pressable
                      style={styles.stepperMiniBtn}
                      onPress={() => updateSet(currentExec.exerciseId, s.id, 'reps', Math.max(1, s.reps - 1))}
                    >
                      <Text style={styles.stepperMiniText}>-</Text>
                    </Pressable>
                    <Text style={styles.statValue}>{s.reps} reps</Text>
                    <Pressable
                      style={styles.stepperMiniBtn}
                      onPress={() => updateSet(currentExec.exerciseId, s.id, 'reps', s.reps + 1)}
                    >
                      <Text style={styles.stepperMiniText}>+</Text>
                    </Pressable>
                  </View>

                  {/* Checkbox Button */}
                  <Pressable
                    style={[styles.checkSquare, s.completed && styles.checkSquareCompleted]}
                    onPress={() => handleToggleSet(s.id)}
                    hitSlop={8}
                  >
                    {s.completed ? (
                      <Icon name="check" size={16} color="#FFFFFF" />
                    ) : (
                      <View style={styles.emptyCircle} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Add Set Button */}
          <Pressable
            style={styles.addSetButton}
            onPress={() => addSet(currentExec.exerciseId)}
          >
            <Icon name="plus" size={14} color="#FF1E27" />
            <Text style={styles.addSetText}>Adicionar série</Text>
          </Pressable>

          {/* Concluir Exercício CTA */}
          <Pressable
            style={({ pressed }) => [styles.concludeBtn, pressed && styles.pressed]}
            onPress={handleFinishCurrent}
          >
            <Text style={styles.concludeBtnText}>
              {hasNext ? 'Concluir exercício' : 'Finalizar treino'}
            </Text>
          </Pressable>
        </View>

        {/* Next Exercise Preview Card */}
        {nextExec ? (
          <View style={styles.nextSection}>
            <Text style={styles.nextOverline}>PRÓXIMO EXERCÍCIO</Text>
            <Pressable
              style={({ pressed }) => [styles.nextCard, pressed && styles.pressed]}
              onPress={() => goToExerciseByIndex(exerciseIndex + 1)}
            >
              <View style={styles.nextThumb}>
                {nextCatalogExercise?.startImage ? (
                  <Image source={{ uri: nextCatalogExercise.startImage }} style={styles.iconBadgeImg} />
                ) : (
                  <Icon name="dumbbell" size="sm" color="#8E8E93" />
                )}
              </View>
              <View style={styles.nextInfo}>
                <Text style={styles.nextTitle} numberOfLines={1}>
                  {nextExec.exerciseName}
                </Text>
                <Text style={styles.nextSub}>
                  {nextExec.plannedSets} séries • {nextExec.plannedReps} reps
                </Text>
              </View>
              <Icon name="chevronRight" size="sm" color="#666666" />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal com Passo a Passo e Dicas */}
      {catalogExercise ? (
        <ExerciseDetailModal
          visible={detailModalVisible}
          exercise={catalogExercise}
          onClose={() => setDetailModalVisible(false)}
        />
      ) : null}

      {/* Confirmation to finish workout */}
      <ConfirmationModal
        visible={finishModalVisible}
        title="Finalizar treino?"
        message="Todos os exercícios foram concluídos. Deseja salvar este treino em seu histórico?"
        confirmLabel="Finalizar treino"
        onConfirm={handleConfirmFinishWorkout}
        onCancel={() => setFinishModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0A0A0C',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#0A0A0C',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1E',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242428',
  },
  headerWorkoutInfo: {
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  workoutSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242428',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#242428',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF1E27',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  activeCard: {
    backgroundColor: '#141416',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  exerciseIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A30',
  },
  iconBadgeImg: {
    width: '100%',
    height: '100%',
  },
  cardHeaderTitles: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  exerciseSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  videoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A30',
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#222226',
  },
  tipWrap: {
    marginBottom: spacing.md,
  },
  setsList: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#222226',
    gap: spacing.xs,
  },
  setRowActive: {
    borderColor: '#FF1E27',
    backgroundColor: '#1E1214',
  },
  setRowCompleted: {
    backgroundColor: 'rgba(255, 30, 39, 0.06)',
    borderColor: 'rgba(255, 30, 39, 0.3)',
  },
  setNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#24242A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumBadgeActive: {
    backgroundColor: '#FF1E27',
  },
  setNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },
  setNumTextActive: {
    color: colors.white,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121214',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#26262C',
  },
  stepperMiniBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepperMiniText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '700',
  },
  statValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  checkSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#202026',
    borderWidth: 1,
    borderColor: '#303038',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSquareCompleted: {
    backgroundColor: '#FF1E27',
    borderColor: '#FF1E27',
  },
  emptyCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#4A4A52',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: spacing.md,
    gap: 4,
  },
  addSetText: {
    color: '#FF1E27',
    fontSize: 13,
    fontWeight: '600',
  },
  concludeBtn: {
    backgroundColor: '#FF1E27',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  concludeBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  nextSection: {
    marginTop: spacing.sm,
  },
  nextOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
    gap: spacing.md,
  },
  nextThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nextInfo: {
    flex: 1,
    gap: 2,
  },
  nextTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  nextSub: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

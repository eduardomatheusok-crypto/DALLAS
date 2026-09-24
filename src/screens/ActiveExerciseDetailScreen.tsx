import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { Button, LoadingState } from '../components/common';
import Screen from '../components/common/Screen';
import { useWorkoutSession, useExercises, useRestTimer } from '../hooks';
import { findExerciseByIdOrName, playTimerEndSound, resolveCanonicalName } from '../services';
import { CURATED_EXERCISES } from '../data/curatedExercises';
import { colors, spacing, borderRadius, typography } from '../theme';
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

  const {
    exercises: execExercises,
    lastResults,
    toggleExerciseCompleted,
    toggleSetCompleted,
    updateSet,
    bumpWeight,
    addSet,
    updateNotes,
    toggleBlock,
  } = useWorkoutSession();

  const { exercises: catalogExercises } = useExercises();
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  const hasNext = exerciseIndex >= 0 && exerciseIndex < execExercises.length - 1;
  const hasPrev = exerciseIndex > 0;

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
      navigation.goBack();
    }
  };

  if (!currentExec) {
    return (
      <Screen>
        <LoadingState label="Exercício não encontrado na sessão" />
      </Screen>
    );
  }

  const lastResult = lastResults.get(currentExec.exerciseId);
  const muscle = catalogExercise?.muscleGroup || currentExec.muscleGroup;
  const equip = catalogExercise?.equipment;
  const subtitle = [muscle, equip].filter(Boolean).join(' · ');
  const displayName = catalogExercise?.name || (currentExec.exerciseName !== 'Exercício' ? currentExec.exerciseName : 'Exercício');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Icon name="chevronLeft" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.headerSubtitle}>
            Exercício {exerciseIndex + 1} de {execExercises.length}
          </Text>
        </View>

        <Pressable
          style={styles.infoButton}
          onPress={() => setDetailModalVisible(true)}
          hitSlop={12}
        >
          <Icon name="info" size={22} color={colors.primary} />
        </Pressable>
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
        {/* Visualização de Mídia / Execução se disponível */}
        {catalogExercise?.startImage ? (
          <View style={styles.mediaCard}>
            <ExerciseMediaViewer
              startImage={catalogExercise.startImage}
              endImage={catalogExercise.endImage}
              autoAnimate
            />
          </View>
        ) : null}

        {/* Dica do Dallas Biomecânica */}
        {catalogExercise?.dallasTip ? (
          <View style={styles.tipWrapper}>
            <DallasExerciseTip tip={catalogExercise.dallasTip} />
          </View>
        ) : null}

        {/* Resumo do Exercício e Botão "Como Executar" */}
        <View style={styles.actionHeader}>
          <View style={styles.metaInfo}>
            {subtitle ? <Text style={styles.metaSubtitle}>{subtitle}</Text> : null}
            <Text style={styles.metaPlan}>
              Alvo: {currentExec.plannedSets} séries × {currentExec.plannedReps} reps
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.guideButton, pressed && styles.guideButtonPressed]}
            onPress={() => setDetailModalVisible(true)}
            hitSlop={8}
          >
            <Icon name="info" size={13} color="#A1B0CC" />
            <Text style={styles.guideButtonText}>Como executar</Text>
          </Pressable>
        </View>

        {/* Tabela de Séries */}
        <View style={styles.setsTableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, styles.colNum]}>#</Text>
            <Text style={[styles.colHeader, styles.colPrev]}>ANTERIOR</Text>
            <Text style={[styles.colHeader, styles.colKg]}>KG</Text>
            <Text style={[styles.colHeader, styles.colReps]}>REPS</Text>
            <Text style={[styles.colHeader, styles.colCheck]}>✔</Text>
          </View>

          {currentExec.sets.map((s, idx) => {
            const histItem = lastResult?.[idx] ?? (lastResult && lastResult.length > 0 ? lastResult[lastResult.length - 1] : null);
            const prevText = histItem ? `${histItem.weight}k × ${histItem.reps}` : '-';

            return (
              <View
                key={s.id}
                style={[
                  styles.setRow,
                  s.completed && styles.setRowCompleted,
                ]}
              >
                <Text style={styles.setNumber}>{s.setNumber}</Text>
                <Text style={styles.prevText}>{prevText}</Text>

                <View style={styles.inputContainer}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => bumpWeight(currentExec.exerciseId, s.id, -2.5)}
                  >
                    <Text style={styles.stepperText}>-</Text>
                  </Pressable>
                  <Text style={styles.valueText}>{s.weight}</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => bumpWeight(currentExec.exerciseId, s.id, 2.5)}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>

                <View style={styles.inputContainer}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => updateSet(currentExec.exerciseId, s.id, 'reps', Math.max(1, s.reps - 1))}
                  >
                    <Text style={styles.stepperText}>-</Text>
                  </Pressable>
                  <Text style={styles.valueText}>{s.reps}</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => updateSet(currentExec.exerciseId, s.id, 'reps', s.reps + 1)}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.checkBtn, s.completed && styles.checkBtnCompleted]}
                  onPress={() => toggleSetCompleted(currentExec.exerciseId, s.id)}
                >
                  <Icon
                    name="check"
                    size={16}
                    color={s.completed ? '#FFFFFF' : '#48484A'}
                  />
                </Pressable>
              </View>
            );
          })}

          <Pressable
            style={styles.addSetButton}
            onPress={() => addSet(currentExec.exerciseId)}
          >
            <Icon name="plus" size={16} color={colors.primary} />
            <Text style={styles.addSetText}>Adicionar série</Text>
          </Pressable>
        </View>

        {/* Botão de Concluir Exercício */}
        <Button
          title={hasNext ? 'Concluir e próximo exercício ->' : 'Concluir exercício'}
          variant="primary"
          icon="check"
          onPress={handleFinishCurrent}
          style={styles.finishExerciseBtn}
        />

        {/* Navegação entre exercícios */}
        <View style={styles.navRow}>
          {hasPrev ? (
            <Button
              title="<- Anterior"
              variant="secondary"
              onPress={() => goToExerciseByIndex(exerciseIndex - 1)}
              style={{ flex: 1, marginRight: 8 }}
            />
          ) : null}
          {hasNext ? (
            <Button
              title="Próximo ->"
              variant="secondary"
              onPress={() => goToExerciseByIndex(exerciseIndex + 1)}
              style={{ flex: 1, marginLeft: hasPrev ? 8 : 0 }}
            />
          ) : null}
        </View>
      </ScrollView>

      {/* Modal com Passo a Passo e Dicas */}
      {catalogExercise ? (
        <ExerciseDetailModal
          visible={detailModalVisible}
          exercise={catalogExercise}
          onClose={() => setDetailModalVisible(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    backgroundColor: '#121214',
  },
  backButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  headerSubtitle: {
    ...typography.caption,
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  infoButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 32,
  },
  mediaCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242428',
  },
  tipWrapper: {
    marginBottom: 10,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  metaInfo: {
    flexShrink: 1,
    marginRight: 10,
  },
  metaSubtitle: {
    ...typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 14,
  },
  metaPlan: {
    ...typography.caption,
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E22',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C32',
    gap: 6,
  },
  guideButtonPressed: {
    opacity: 0.75,
  },
  guideButtonText: {
    color: '#D2E0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  setsTableCard: {
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#26262A',
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#26262A',
    marginBottom: 8,
  },
  colHeader: {
    ...typography.caption,
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  colNum: { width: 28 },
  colPrev: { flex: 1.2, textAlign: 'left', paddingLeft: 6 },
  colKg: { flex: 1.4 },
  colReps: { flex: 1.4 },
  colCheck: { width: 36 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
  },
  setNumber: {
    width: 28,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  prevText: {
    flex: 1.2,
    color: '#8E8E93',
    fontSize: 11,
    paddingLeft: 6,
  },
  inputContainer: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202024',
    borderRadius: 8,
    marginHorizontal: 3,
    paddingVertical: 4,
  },
  stepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepperText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '700',
  },
  valueText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    minWidth: 26,
    textAlign: 'center',
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  checkBtnCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  addSetText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  finishExerciseBtn: {
    marginBottom: 14,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

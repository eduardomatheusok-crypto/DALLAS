import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { Button, ConfirmationModal, LoadingState } from '../components/common';
import Screen from '../components/common/Screen';
import ExercisePickerModal from '../components/common/ExercisePickerModal';
import { useWorkouts, useExercises, useWorkoutSession, useRestTimer } from '../hooks';
import { exerciseService, findExerciseByIdOrName, playTimerEndSound } from '../services';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';
import RestTimerOverlay from '../components/workout/RestTimerOverlay';
import WorkoutSessionExerciseCard from '../components/workout/WorkoutSessionExerciseCard';
import type { RootStackParamList } from '../navigation/types';
import type { Exercise } from '../models';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = {
  key: string;
  name: string;
  params: { workoutId: string };
};

export default function ExerciseExecutionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { workoutId } = route.params;

  const { workouts, loading: wLoading, reload: reloadWorkouts } = useWorkouts();
  const { exercises, reload: reloadExercises } = useExercises();

  const {
    exercises: execExercises,
    completedCount,
    totalExercises,
    progress,
    completedSets,
    totalSets,
    startSession,
    toggleExerciseCompleted,
    addExerciseToSession,
    finishSession,
    clearSession,
  } = useWorkoutSession();

  const [finishVisible, setFinishVisible] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const initializedWorkoutIdRef = useRef<string | null>(null);

  const workout = useMemo(
    () => workouts.find((w) => w.id === workoutId),
    [workouts, workoutId],
  );

  // Hook do timer de descanso global para que continue ativo durante a visualização
  const restTimer = useRestTimer({
    onEnd: (reason) => {
      if (reason === 'finished') {
        playTimerEndSound();
      }
    },
  });

  useEffect(() => {
    if (!workout) return;
    if (initializedWorkoutIdRef.current === workout.id) return;
    initializedWorkoutIdRef.current = workout.id;
    startSession(workout, exercises);
  }, [workout, exercises, startSession]);

  // Primeiro exercício incompleto para definir como ativo
  const firstIncompleteIndex = useMemo(
    () => execExercises.findIndex((e) => !e.completed),
    [execExercises],
  );

  const handleStartOrContinue = () => {
    Haptics.selectionAsync().catch(() => {});
    const targetIdx = firstIncompleteIndex !== -1 ? firstIncompleteIndex : 0;
    if (execExercises[targetIdx]) {
      navigation.navigate('ActiveExerciseDetail', {
        workoutId,
        exerciseId: execExercises[targetIdx].exerciseId,
        exerciseIndex: targetIdx,
      });
    }
  };

  const handleOpenExercise = (exerciseId: string, index: number) => {
    navigation.navigate('ActiveExerciseDetail', {
      workoutId,
      exerciseId,
      exerciseIndex: index,
    });
  };

  const handleFinishWorkout = async () => {
    setSaving(true);
    try {
      const payload = await finishSession();
      setFinishVisible(false);
      navigation.navigate('WorkoutComplete', payload);
    } catch (e) {
      console.error('Erro ao finalizar treino:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardWorkout = () => {
    clearSession();
    setDiscardVisible(false);
    navigation.goBack();
  };

  const handleAddCustomExercise = async (name: string, muscleGroup: Exercise['muscleGroup']) => {
    const created = await exerciseService.createCustom(name, muscleGroup);
    await reloadExercises();
    await addExerciseToSession(created);
    return created;
  };

  if (wLoading) return <Screen><LoadingState /></Screen>;
  if (!workout) return <Screen><LoadingState label="Treino não encontrado" /></Screen>;

  return (
    <View style={styles.container}>
      {/* Header idêntico à imagem de referência */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setDiscardVisible(true)}
          style={styles.headerBtn}
          hitSlop={12}
        >
          <Icon name="chevronLeft" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.workoutName} numberOfLines={1}>
            {workout.name}
          </Text>
          <Text style={styles.exerciseCounter}>
            {completedCount} de {totalExercises} exercícios
          </Text>
        </View>

        <Pressable
          onPress={() => setMenuVisible(true)}
          style={styles.headerBtn}
          hitSlop={12}
        >
          <Icon name="menuVertical" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Barra de Progresso com Métricas */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressMetrics}>
          {completedSets}/{totalSets} séries · {completedCount}/{totalExercises} exercícios
        </Text>
      </View>

      {/* Overlay do Cronômetro de descanso se estiver ativo */}
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

      {/* Lista de Cards de Exercícios */}
      <FlatList
        data={execExercises}
        keyExtractor={(item) => item.exerciseId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const catalogEx = findExerciseByIdOrName(exercises, item.exerciseId, item.exerciseName);
          const isDone = item.completed;
          const isCurrentActive = index === firstIncompleteIndex && !isDone;

          return (
            <WorkoutSessionExerciseCard
              exerciseId={item.exerciseId}
              name={item.exerciseName}
              muscleGroup={catalogEx?.muscleGroup || item.muscleGroup}
              equipment={catalogEx?.equipment}
              imageUrl={catalogEx?.startImage || catalogEx?.gifUrl}
              plannedSets={item.plannedSets}
              plannedReps={item.plannedReps}
              completedSets={item.sets.filter((s) => s.completed).length}
              isCompleted={isDone}
              isActive={isCurrentActive}
              onPress={() => handleOpenExercise(item.exerciseId, index)}
              onToggleComplete={() => toggleExerciseCompleted(item.exerciseId)}
            />
          );
        }}
      />

      {/* Barra Inferior com Botão Pill */}
      <View style={styles.footerContainer}>
        {completedCount === totalExercises && totalExercises > 0 ? (
          <Button
            title="Finalizar treino"
            variant="primary"
            icon="checkmarkDone"
            onPress={() => setFinishVisible(true)}
            style={styles.primaryActionButton}
          />
        ) : (
          <Pressable
            style={styles.continuePillButton}
            onPress={handleStartOrContinue}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
          >
            <View style={styles.pillContent}>
              <Icon name="plus" size={16} color="#A1B0CC" />
              <Text style={styles.pillText}>Acompanhar treino</Text>
              <Icon name="chevronRight" size={16} color="#A1B0CC" />
            </View>
          </Pressable>
        )}

        {completedCount > 0 && completedCount < totalExercises && (
          <Pressable
            style={styles.finishEarlyButton}
            onPress={() => setFinishVisible(true)}
          >
            <Text style={styles.finishEarlyText}>Finalizar treino agora</Text>
          </Pressable>
        )}
      </View>

      {/* Menu de 3 Pontos */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setPickerVisible(true);
              }}
            >
              <Icon name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.menuItemText}>Adicionar exercício</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                setMenuVisible(false);
                setDiscardVisible(true);
              }}
            >
              <Icon name="trash" size={18} color="#FF453A" />
              <Text style={[styles.menuItemText, { color: '#FF453A' }]}>
                Descartar treino
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Adicionar Exercício */}
      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAdd={(ex) => addExerciseToSession(ex)}
        selectedIds={execExercises.map((e) => e.exerciseId)}
        onCreateCustom={handleAddCustomExercise}
      />

      {/* Modal Finalizar Treino */}
      <ConfirmationModal
        visible={finishVisible}
        title="Finalizar treino?"
        message="Seu treino será registrado com todas as cargas e séries computadas."
        confirmLabel="Finalizar"
        onConfirm={handleFinishWorkout}
        onCancel={() => setFinishVisible(false)}
      />

      {/* Modal Descartar Treino */}
      <ConfirmationModal
        visible={discardVisible}
        title="Sair do treino?"
        message="Tem certeza de que deseja sair? O progresso não salvo desta sessão será cancelado."
        confirmLabel="Sair"
        onConfirm={handleDiscardWorkout}
        onCancel={() => setDiscardVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
  },
  headerBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  workoutName: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  exerciseCounter: {
    ...typography.caption,
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#1E1E22',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary, // #E50914
    borderRadius: 2,
  },
  progressMetrics: {
    ...typography.caption,
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(13, 13, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1E',
  },
  continuePillButton: {
    backgroundColor: '#141E30',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#24324E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: '#D2E0FF',
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  primaryActionButton: {
    borderRadius: 28,
    height: 52,
  },
  finishEarlyButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  finishEarlyText: {
    color: '#8E8E93',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
});
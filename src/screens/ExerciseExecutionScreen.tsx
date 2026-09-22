import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { Button, Card, ConfirmationModal, LoadingState } from '../components/common';
import ProgressBar from '../components/common/ProgressBar';
import Screen from '../components/common/Screen';
import ExercisePickerModal from '../components/common/ExercisePickerModal';
import { useWorkouts, useExercises, useTrainingSettings, useRestTimer } from '../hooks';
import { workoutLogService, workoutService, buildLog, exerciseService, playTimerEndSound } from '../services';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';
import RestTimerOverlay from '../components/workout/RestTimerOverlay';
import type { RootStackParamList } from '../navigation/types';
import type {
  Exercise,
  WorkoutLogExercise,
  WorkoutLogBlock,
  WorkoutSet,
  SetType,
  SetCategory,
  AdvancedTechniqueKind,
  WorkoutExercisePlan,
} from '../models';
import {
  SET_CATEGORY_LABEL,
  planSetCategories,
  planWorkingSets,
  planWarmupSets,
  planPreparationSets,
  isCompositeTechnique,
  isWorkingSet,
  techniqueName,
  exBlocksFor,
  type AdvancedTechnique,
} from '../models';
import { SET_CATEGORY_THEME } from '../theme';
import { suggestProgression } from '../utils/progression';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = {
  key: string;
  name: string;
  params: { workoutId: string };
};

export interface ExecutionExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  plannedSets: number;
  plannedReps: number;
  warmupSets: number;
  preparationSets: number;
  workingSets: number;
  advancedTechnique?: AdvancedTechnique;
  /** Blocos da técnica avançada configurados para esta execução. */
  blocks: WorkoutLogBlock[];
  sets: WorkoutSet[];
  completed: boolean;
  notes: string;
  /** Descanso específico (s) configurado para este exercício. */
  restSeconds?: number;
}

export interface RestCountdownInfo {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  restSeconds: number;
  nextSetNumber?: number;
}

const WEIGHT_STEP = 2.5;

/** Mapeia uma técnica de exercício para o tipo de série usado nas séries válidas. */
function techniqueToSetType(kind: AdvancedTechniqueKind | undefined): SetType {
  switch (kind) {
    case 'cluster': return 'cluster';
    case 'myo': return 'myo';
    case 'drop-set': return 'drop';
    case 'rest-pause': return 'backoff';
    default: return 'normal';
  }
}

/** Identifica o exercício cuja contagem de séries válidas concluídas aumentou. */
function detectNewlyCompletedSet(prev: string, curr: string): { exerciseId: string } | null {
  const parse = (summary: string) => {
    const arr = JSON.parse(summary) as { id: string; done: string[] }[];
    return new Map(arr.map((x) => [x.id, x.done]));
  };
  const prevMap = parse(prev);
  const currMap = parse(curr);
  for (const [exId, done] of currMap) {
    const prevDone = prevMap.get(exId) ?? [];
    if (done.length > prevDone.length) return { exerciseId: exId };
  }
  return null;
}

/** Constrói as categorias de série (com prefixos A/P/S) a partir do plano. */
function buildSetSegments(
  plan: WorkoutExercisePlan,
): { category: SetCategory; startNumber: number; type: SetType }[] {
  const techniqueKind = plan.advancedTechnique?.kind;
  const workingType = isCompositeTechnique(techniqueKind as AdvancedTechniqueKind)
    ? 'normal'
    : techniqueToSetType(techniqueKind);
  const categories = planSetCategories(plan);
  let warmupN = 0;
  let prepN = 0;
  let workingN = 0;
  return categories.map((cat) => {
    if (cat === 'warmup') {
      warmupN += 1;
      return { category: cat, startNumber: warmupN, type: 'normal' };
    }
    if (cat === 'preparation') {
      prepN += 1;
      return { category: cat, startNumber: prepN, type: 'normal' };
    }
    workingN += 1;
    return { category: cat, startNumber: workingN, type: workingType };
  });
}

export default function ExerciseExecutionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { workoutId } = route.params;

  const { workouts, loading: wLoading, reload: reloadWorkouts } = useWorkouts();
  const { exercises, reload: reloadExercises } = useExercises();
  const { settings } = useTrainingSettings();
  const restTimer = useRestTimer({
    onEnd: (reason) => {
      if (reason === 'finished') {
        playTimerEndSound();
      }
    },
  });
  const [execExercises, setExecExercises] = useState<ExecutionExercise[]>([]);
  const [lastResults, setLastResults] = useState<Map<string, { weight: number; reps: number }[]>>(new Map());
  const [finishVisible, setFinishVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [restCountdownModal, setRestCountdownModal] = useState<RestCountdownInfo | null>(null);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  const startedAtRef = useRef<string>(new Date().toISOString());

  const workout = useMemo(
    () => workouts.find((w) => w.id === workoutId),
    [workouts, workoutId],
  );

  useEffect(() => {
    if (!workout) return;
    buildSession(workout.exercises, exercises, setExecExercises, setLastResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.id, workouts, exercises]);

  const completedCount = execExercises.filter((e) => e.completed).length;
  const totalExercises = execExercises.length;
  const progress = totalExercises > 0 ? completedCount / totalExercises : 0;
  const completedSets = execExercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed).length,
    0,
  );
  const workingSetsDone = execExercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.completed && isWorkingSet(s)).length,
    0,
  );
  const totalSets = execExercises.reduce((acc, e) => acc + e.sets.length, 0);

  // Cancela um timer pendente ao sair da tela.
  useEffect(() => () => restTimer.cancel(), [restTimer.cancel]);

  const handleStartRest = (info: RestCountdownInfo) => {
    setRestCountdownModal(null);
    restTimer.start({
      id: `rest-${info.exerciseId}-${info.setNumber}-${Date.now()}`,
      durationSeconds: info.restSeconds,
      title: `${info.exerciseName} · Descanso`,
      subtitle: info.nextSetNumber ? `Próxima: Série ${info.nextSetNumber}` : `Série ${info.setNumber} concluída`,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    let triggeredRest: RestCountdownInfo | null = null;

    setExecExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const setIdx = e.sets.findIndex((s) => s.id === setId);
        if (setIdx === -1) return e;
        const target = e.sets[setIdx];

        // Se já estava concluída, apenas desmarca sem disparar timer
        if (target.completed) {
          const updated = [...e.sets];
          updated[setIdx] = { ...target, completed: false };
          return { ...e, sets: updated, completed: false };
        }

        // Se estava pendente, obtém valores com fallback inteligente
        const history = lastResults.get(exerciseId);
        const historyItem = history?.[setIdx] ?? (history && history.length > 0 ? history[history.length - 1] : null);

        let weight = target.weight;
        let reps = target.reps;

        if (weight <= 0) {
          const prevSet = setIdx > 0 ? e.sets[setIdx - 1] : null;
          if (prevSet && prevSet.weight > 0) {
            weight = prevSet.weight;
          } else if (historyItem && historyItem.weight > 0) {
            weight = historyItem.weight;
          } else {
            const planEx = workout?.exercises.find((we) => we.exerciseId === exerciseId);
            weight = planEx?.initialWeight ?? 0;
          }
        }

        if (reps <= 0) {
          const prevSet = setIdx > 0 ? e.sets[setIdx - 1] : null;
          if (prevSet && prevSet.reps > 0) {
            reps = prevSet.reps;
          } else if (historyItem && historyItem.reps > 0) {
            reps = historyItem.reps;
          } else {
            reps = e.plannedReps > 0 ? e.plannedReps : 10;
          }
        }

        const updated = [...e.sets];
        updated[setIdx] = {
          ...target,
          weight,
          reps,
          completed: true,
          isCustomWeight: target.isCustomWeight ?? false,
          isCustomReps: target.isCustomReps ?? false,
        };

        // Propaga peso e reps para a próxima série caso esteja pendente e zerada
        if (setIdx + 1 < updated.length) {
          const next = updated[setIdx + 1];
          if (!next.completed && next.weight <= 0 && next.reps <= 0) {
            updated[setIdx + 1] = {
              ...next,
              weight,
              reps,
            };
          }
        }

        const allDone = updated.every((s) => s.completed);

        // Dispara o modal de contagem de descanso ao concluir a série
        const duration = e.restSeconds ?? settings.defaultRestSeconds ?? 60;
        triggeredRest = {
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          setNumber: target.setNumber,
          restSeconds: duration,
          nextSetNumber: setIdx + 1 < updated.length ? updated[setIdx + 1].setNumber : undefined,
        };

        return { ...e, sets: updated, completed: allDone };
      }),
    );

    if (triggeredRest) {
      setRestCountdownModal(triggeredRest);
    }
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setExecExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const setIdx = e.sets.findIndex((s) => s.id === setId);
        if (setIdx === -1) return e;
        const updated = [...e.sets];
        const isCustomField = field === 'weight' ? 'isCustomWeight' : 'isCustomReps';
        const next = { ...updated[setIdx], [field]: value, [isCustomField]: true };
        updated[setIdx] = next;

        // Se o usuário digitou uma nova carga positiva, propaga como sugestão para a próxima série pendente não customizada
        if (field === 'weight' && value > 0 && setIdx + 1 < updated.length) {
          const nextSet = updated[setIdx + 1];
          if (!nextSet.completed && !nextSet.isCustomWeight) {
            updated[setIdx + 1] = { ...nextSet, weight: value };
          }
        }

        return { ...e, sets: updated };
      }),
    );
  };

  const updateNotes = (exerciseId: string, notes: string) => {
    setExecExercises((prev) =>
      prev.map((e) => (e.exerciseId === exerciseId ? { ...e, notes } : e)),
    );
  };

  const toggleBlock = (exerciseId: string, blockOrder: number) => {
    setExecExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        return {
          ...e,
          blocks: e.blocks.map((b) =>
            b.order === blockOrder ? { ...b, completed: !b.completed } : b,
          ),
        };
      }),
    );
  };

  const bumpWeight = (exerciseId: string, setId: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExecExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const setIdx = e.sets.findIndex((s) => s.id === setId);
        if (setIdx === -1) return e;
        const target = e.sets[setIdx];

        let baseWeight = target.weight;
        if (baseWeight <= 0) {
          const history = lastResults.get(exerciseId);
          const historyItem = history?.[setIdx] ?? (history && history.length > 0 ? history[history.length - 1] : null);
          baseWeight = historyItem?.weight ?? workout?.exercises.find((we) => we.exerciseId === exerciseId)?.initialWeight ?? 0;
        }

        const weight = Math.max(0, Math.round((baseWeight + delta) * 10) / 10);
        const updated = [...e.sets];
        updated[setIdx] = { ...target, weight };

        // Propaga para a próxima série pendente e zerada
        if (setIdx + 1 < updated.length) {
          const nextSet = updated[setIdx + 1];
          if (!nextSet.completed && nextSet.weight <= 0) {
            updated[setIdx + 1] = { ...nextSet, weight };
          }
        }

        return { ...e, sets: updated };
      }),
    );
  };

  const addSet = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExecExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              id: `new-${Date.now()}`,
              setNumber: last ? last.setNumber + 1 : 1,
              weight: last ? last.weight : 0,
              reps: 0,
              completed: false,
              type: last?.type ?? 'normal',
              category: last?.category ?? 'working',
            },
          ],
        };
      }),
    );
  };

  const completeExercise = (exerciseId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setExecExercises((prev) =>
      prev.map((e) => (e.exerciseId === exerciseId ? { ...e, completed: true } : e)),
    );
  };

  const resetExercise = (exerciseId: string) => {
    setExecExercises((prev) =>
      prev.map((e) => (e.exerciseId === exerciseId ? { ...e, completed: false } : e)),
    );
  };

  const addExerciseToSession = async (exercise: Exercise) => {
    setPickerVisible(false);
    setExecExercises((prev) => {
      if (prev.some((e) => e.exerciseId === exercise.id)) return prev;
      const next: ExecutionExercise = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        plannedSets: 3,
        plannedReps: 10,
        warmupSets: 0,
        preparationSets: 0,
        workingSets: 3,
        blocks: [],
        sets: Array.from({ length: 3 }, (_, i) => ({
          id: `initial-${Date.now()}-${i}`,
          setNumber: i + 1,
          weight: 0,
          reps: 0,
          completed: false,
          type: 'normal',
          category: 'working',
        })),
        completed: false,
        notes: '',
      };
      return [...prev, next];
    });
    // Persiste o exercício no plano do treino para sessões futuras
    if (workout) {
      const plan = [...workout.exercises];
      plan.push({
        exerciseId: exercise.id,
        order: plan.length + 1,
        plannedSets: 3,
        plannedReps: 10,
      });
      try {
        await workoutService.saveWorkout(workout.name, plan, workout.id);
        await reloadWorkouts();
      } catch {
        // melhor esforço
      }
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const createAndAddExercise = async (name: string, muscleGroup: Exercise['muscleGroup']) => {
    const created = await exerciseService.createCustom(name, muscleGroup);
    await reloadExercises();
    return created;
  };

  const finishWorkout = async () => {
    setSaving(true);
    const finishedAt = new Date().toISOString();
    const logExercises: WorkoutLogExercise[] = execExercises.map((e) => ({
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      muscleGroup: e.muscleGroup,
      plannedSets: e.plannedSets,
      plannedReps: e.plannedReps,
      notes: e.notes?.trim() ? e.notes.trim() : undefined,
      blocks: e.blocks.length > 0 ? e.blocks : undefined,
      sets: e.sets,
      completed: e.completed,
    }));
    const log = buildLog({
      workoutId,
      workoutName: workout?.name ?? 'Treino',
      startedAt: startedAtRef.current,
      finishedAt,
      exercises: logExercises,
    });
    await workoutLogService.saveLog(log);
    await workoutLogService.invalidate();
    await workoutService.invalidate();
    setSaving(false);
    setFinishVisible(false);
    navigation.navigate('WorkoutComplete', {
      durationSeconds: log.durationSeconds,
      volume: log.totalVolume,
      series: workingSetsDone,
    });
  };

  if (wLoading) return <Screen><LoadingState /></Screen>;
  if (!workout) return <Screen><LoadingState label="Treino não encontrado" /></Screen>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[typography.overline, styles.headerOverline]}>Sessão</Text>
          <Text style={[typography.subtitle, styles.headerTitle]} numberOfLines={1}>
            {workout.name}
          </Text>
          <Text style={[typography.caption, styles.headerCount]}>
            {completedCount} de {totalExercises} exercícios
          </Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} disabled={saving} style={styles.closeButton} hitSlop={12}>
          <Icon name="close" size="md" color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progresso do treino</Text>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar progress={progress} />
        <Text style={[typography.small, styles.progressDetail]}>
          {completedSets}/{totalSets} séries · {completedCount}/{totalExercises} exercícios
        </Text>
      </View>

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

      <FlatList
        data={execExercises}
        keyExtractor={(item) => item.exerciseId}
        style={styles.listScroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <WorkoutExerciseBlock
            exercise={item}
            lastResult={lastResults.get(item.exerciseId)}
            activeSetId={activeSetId}
            onUpdateSet={updateSet}
            onToggleSetCompleted={toggleSetCompleted}
            onUpdateNotes={updateNotes}
            onToggleBlock={toggleBlock}
            onBumpWeight={bumpWeight}
            onAddSet={addSet}
            onComplete={completeExercise}
            onReset={resetExercise}
            onConfigure={() =>
              navigation.navigate('WorkoutExerciseConfig', {
                workoutId,
                exerciseId: item.exerciseId,
              })
            }
          />
        )}
      />

      <View style={styles.footer}>
        <Button
          title="Adicionar"
          variant="secondary"
          icon="plus"
          style={styles.footerSecondary}
          onPress={() => setPickerVisible(true)}
        />
        <Button
          title={completedCount === 0 ? 'Finalizar treino' : `Finalizar (${completedCount}/${totalExercises})`}
          icon="checkmarkDone"
          style={styles.footerPrimary}
          onPress={() => setFinishVisible(true)}
          disabled={completedCount === 0}
        />
      </View>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAdd={addExerciseToSession}
        selectedIds={execExercises.map((e) => e.exerciseId)}
        onCreateCustom={createAndAddExercise}
      />

      <ConfirmationModal
        visible={finishVisible}
        title="Finalizar treino?"
        message="Seu treino será salvo no histórico."
        confirmLabel="Finalizar"
        onConfirm={finishWorkout}
        onCancel={() => setFinishVisible(false)}
      />

      {/* Modal com contagem regressiva de 3s e relógio tremendo ao concluir série */}
      <StartRestCountdownModal
        info={restCountdownModal}
        onStartRest={handleStartRest}
        onCancel={() => setRestCountdownModal(null)}
      />
    </View>
  );
}

interface StartRestCountdownModalProps {
  info: RestCountdownInfo | null;
  onStartRest: (info: RestCountdownInfo) => void;
  onCancel: () => void;
}

function StartRestCountdownModal({
  info,
  onStartRest,
  onCancel,
}: StartRestCountdownModalProps) {
  const [count, setCount] = useState(3);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const currentInfoRef = useRef(info);
  currentInfoRef.current = info;

  useEffect(() => {
    if (!info) {
      setCount(3);
      shakeAnim.setValue(0);
      scaleAnim.setValue(1);
      return;
    }

    setCount(3);
    scaleAnim.setValue(1.4);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    const runShakeAndStart = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -14, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 14, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          if (currentInfoRef.current) {
            onStartRest(currentInfoRef.current);
          }
        }, 350);
      });
    };

    const t1 = setTimeout(() => {
      setCount(2);
      scaleAnim.setValue(1.4);
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 1000);

    const t2 = setTimeout(() => {
      setCount(1);
      scaleAnim.setValue(1.4);
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 2000);

    const t3 = setTimeout(() => {
      setCount(0);
      runShakeAndStart();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [info, onStartRest, scaleAnim, shakeAnim]);

  if (!info) return null;

  const shakeRotate = shakeAnim.interpolate({
    inputRange: [-14, 14],
    outputRange: ['-18deg', '18deg'],
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.countdownModalBox} onPress={(e) => e.stopPropagation()}>
          {/* Relógio animado com tremor shake */}
          <Animated.View
            style={[
              styles.countdownIconWrap,
              {
                transform: [
                  { translateX: shakeAnim },
                  { rotate: shakeRotate },
                ],
              },
            ]}
          >
            <Icon name="clock" size="lg" color={colors.white} />
          </Animated.View>

          <Text style={[typography.overline, styles.countdownOverline]}>
            SÉRIE {info.setNumber} CONCLUÍDA
          </Text>

          <Text style={[typography.title, styles.countdownTitle]}>
            O seu timer irá começar em:
          </Text>

          <View style={styles.countdownNumberContainer}>
            <Animated.Text
              style={[
                styles.countdownBigNumber,
                { transform: [{ scale: scaleAnim }] },
                count === 0 && styles.countdownNumberZero,
              ]}
            >
              {count}
            </Animated.Text>
            <Text style={styles.countdownSecLabel}>segundos</Text>
          </View>

          <Text style={styles.countdownInfoText}>
            Descanso de {info.restSeconds}s · {info.exerciseName}
          </Text>

          <View style={styles.countdownActionsRow}>
            <Button
              title="Pular descanso"
              variant="secondary"
              onPress={onCancel}
              style={{ flex: 1 }}
            />
            <Button
              title="Iniciar agora"
              variant="primary"
              icon="play"
              onPress={() => onStartRest(info)}
              style={{ flex: 1.2 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Constrói os blocos da técnica avançada (se houver) para um exercício do plano. */
function buildBlocks(plan: WorkoutExercisePlan): WorkoutLogBlock[] {
  const count = exBlocksFor(plan.advancedTechnique, plan.exerciseId);
  return Array.from({ length: count }, (_, i) => ({
    order: i + 1,
    targetReps: plan.plannedReps,
    weight: plan.initialWeight ?? 0,
    completed: false,
  }));
}

function buildSession(
  planExercises: WorkoutExercisePlan[],
  exercises: Exercise[],
  setExec: React.Dispatch<React.SetStateAction<ExecutionExercise[]>>,
  setLast: (v: Map<string, { weight: number; reps: number }[]>) => void,
) {
  const ordered = [...planExercises].sort((a, b) => a.order - b.order);
  const exes: ExecutionExercise[] = ordered.map((we) => {
    const ex = exercises.find((e) => e.id === we.exerciseId);
    const initialWeight = we.initialWeight ?? 0;
    const segments = buildSetSegments(we);
    const sets = segments.map((seg, i) => ({
      id: `p-${i}`,
      setNumber: i + 1,
      // Carga e repetições pré-definidas para todo o exercício
      weight: initialWeight,
      reps: we.plannedReps > 0 ? we.plannedReps : 10,
      completed: false,
      type: seg.type,
      category: seg.category,
      isCustomWeight: false,
      isCustomReps: false,
    }));
    return {
      exerciseId: we.exerciseId,
      exerciseName: ex?.name ?? 'Exercício',
      muscleGroup: ex?.muscleGroup ?? '',
      plannedSets: planWorkingSets(we),
      plannedReps: we.plannedReps,
      warmupSets: planWarmupSets(we),
      preparationSets: planPreparationSets(we),
      workingSets: planWorkingSets(we),
      advancedTechnique: we.advancedTechnique,
      restSeconds: we.restSeconds,
      blocks: buildBlocks(we),
      sets,
      completed: false,
      notes: '',
    };
  });
  setExec(exes);
  (async () => {
    const map = new Map<string, { weight: number; reps: number }[]>();
    for (const we of ordered) {
      const last = await workoutLogService.getLastByExercise(we.exerciseId);
      if (last && last.length > 0) {
        map.set(we.exerciseId, last);
      }
    }
    setLast(map);
    // Se o exercício não tinha peso pré-definido manualmente mas possui histórico anterior,
    // preenche com o peso do último treino para facilitar a vida do usuário.
    setExec((curr) =>
      curr.map((e) => {
        const history = map.get(e.exerciseId);
        if (!history || history.length === 0) return e;
        return {
          ...e,
          sets: e.sets.map((s, idx) => {
            if (s.completed || s.isCustomWeight) return s;
            const hItem = history[idx] ?? history[history.length - 1];
            const weight = s.weight > 0 ? s.weight : (hItem?.weight ?? 0);
            const reps = s.reps > 0 ? s.reps : (hItem?.reps ?? e.plannedReps ?? 10);
            return { ...s, weight, reps, isCustomWeight: false, isCustomReps: false };
          }),
        };
      }),
    );
  })();
}

function WorkoutExerciseBlock({
  exercise,
  lastResult,
  activeSetId,
  onUpdateSet,
  onToggleSetCompleted,
  onUpdateNotes,
  onToggleBlock,
  onBumpWeight,
  onAddSet,
  onComplete,
  onReset,
  onConfigure,
}: {
  exercise: ExecutionExercise;
  lastResult?: { weight: number; reps: number }[];
  activeSetId?: string | null;
  onUpdateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => void;
  onToggleSetCompleted: (exerciseId: string, setId: string) => void;
  onUpdateNotes: (exerciseId: string, notes: string) => void;
  onToggleBlock: (exerciseId: string, blockOrder: number) => void;
  onBumpWeight: (exerciseId: string, setId: string, delta: number) => void;
  onAddSet: (exerciseId: string) => void;
  onComplete: (exerciseId: string) => void;
  onReset: (exerciseId: string) => void;
  onConfigure: () => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  const reference = lastResult && lastResult.length > 0
    ? `${lastResult[lastResult.length - 1].weight} kg × ${lastResult[lastResult.length - 1].reps}`
    : null;

  const doneCount = exercise.sets.filter((s) => s.completed).length;
  const suggestion = suggestProgression(exercise.plannedReps, exercise.sets);
  const showSuggestion = suggestion && doneCount > 0;
  const hasTechnique =
    !!exercise.advancedTechnique && exercise.advancedTechnique.kind !== 'none';
  const nextPendingSet = exercise.sets.find((s) => !s.completed);

  // Agrupa as séries por categoria, preservando a ordem.
  const segments = useMemo(() => {
    const order: SetCategory[] = ['warmup', 'preparation', 'working'];
    const groups = new Map<SetCategory, WorkoutSet[]>();
    for (const cat of order) groups.set(cat, []);
    for (const s of exercise.sets) {
      const cat = s.category ?? 'working';
      groups.get(cat)?.push(s);
    }
    return order
      .filter((cat) => (groups.get(cat)?.length ?? 0) > 0)
      .map((cat) => ({ category: cat, sets: groups.get(cat)!, theme: SET_CATEGORY_THEME[cat] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.sets]);

  return (
    <Card style={[styles.exCard, exercise.completed && styles.exCardDone]}>
      <View style={styles.exHeader}>
        <View style={styles.exTitleWrap}>
          <Text style={[typography.body, styles.exName]} numberOfLines={2}>
            {exercise.exerciseName}
          </Text>
          <View style={styles.exSubtitleWrap}>
            <Text style={styles.muscleText}>{exercise.muscleGroup}</Text>
            <Text style={styles.targetText}>· alvo {exercise.plannedReps} reps</Text>
            {hasTechnique ? (
              <View style={styles.execTechBadge}>
                <Icon name="flash" size="xs" color={colors.primary} />
                <Text style={styles.execTechText}>
                  {techniqueName(exercise.advancedTechnique?.kind as AdvancedTechniqueKind)}
                </Text>
              </View>
            ) : null}
          </View>
          {reference ? (
            <Text style={styles.lastResultText}>Último: {reference}</Text>
          ) : null}
        </View>

        <View style={styles.exHeaderActions}>
          {exercise.completed ? (
            <View style={styles.completedPill}>
              <Icon name="checkmark-circle" size="sm" color={colors.primary} />
              <Text style={styles.completedPillText}>CONCLUÍDO</Text>
            </View>
          ) : null}
          <Pressable onPress={() => setShowNotes((v) => !v)} hitSlop={8} style={styles.iconAction}>
            <Icon
              name="document-text-outline"
              size="sm"
              color={showNotes ? colors.primary : colors.textSecondary}
            />
          </Pressable>
          <Pressable onPress={onConfigure} hitSlop={8} style={styles.iconAction}>
            <Icon name="settings-outline" size="sm" color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {showNotes ? (
        <View style={styles.notesBox}>
          <Text style={[typography.caption, styles.notesLabel]}>Anotação</Text>
          <TextInput
            style={styles.notesInput}
            value={exercise.notes}
            placeholder="Ex.: sentir bem a contração, descanso menor..."
            placeholderTextColor={colors.textMuted}
            onChangeText={(t) => onUpdateNotes(exercise.exerciseId, t)}
            multiline
          />
        </View>
      ) : null}

      {showSuggestion ? (
        <Text style={[styles.suggestionText, suggestion.action === 'progress' && styles.suggestionTextProgress]}>
          {suggestion.message}
        </Text>
      ) : null}

      {exercise.blocks.length > 0 ? (
        <BlockStrip
          blocks={exercise.blocks}
          onToggle={(order) => onToggleBlock(exercise.exerciseId, order)}
        />
      ) : null}

      {segments.map((seg) => {
        const { category, sets, theme } = seg;
        return (
          <View key={category} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.categoryLabel, { color: theme.accent }]}>
                {SET_CATEGORY_LABEL[category]}
              </Text>
              <Text style={styles.categoryCount}>
                {sets.length} {sets.length === 1 ? 'série' : 'séries'}
              </Text>
            </View>

            <View style={styles.setTableHeader}>
              <Text style={[styles.setHeaderText, styles.colSet]}>#</Text>
              <Text style={[styles.setHeaderText, styles.colPrev]}>ANTERIOR</Text>
              <Text style={[styles.setHeaderText, styles.colWeight]}>KG</Text>
              <Text style={[styles.setHeaderText, styles.colReps]}>REPS</Text>
              <Text style={[styles.setHeaderText, styles.colCheck]}>✓</Text>
            </View>

            {sets.map((set) => {
              const prevItem = lastResult?.[set.setNumber - 1] ?? (lastResult && lastResult.length > 0 ? lastResult[lastResult.length - 1] : null);
              const prevText = prevItem && (prevItem.weight > 0 || prevItem.reps > 0)
                ? `${prevItem.weight}k × ${prevItem.reps}`
                : '—';
              const placeholderWeight = prevItem && prevItem.weight > 0 ? String(prevItem.weight) : '0';
              const placeholderReps = prevItem && prevItem.reps > 0 ? String(prevItem.reps) : String(exercise.plannedReps);
              const isActive = activeSetId === set.id;

              return (
                <View
                  key={set.id}
                  style={[
                    styles.setRow,
                    set.completed && styles.setRowDone,
                    isActive && styles.setRowActive,
                  ]}
                >
                  <Text style={[styles.setNumber, styles.colSet, set.completed && styles.setNumberDone]}>
                    {set.setNumber}
                  </Text>

                  <View style={[styles.prevCol, styles.colPrev]}>
                    <Text style={styles.prevText} numberOfLines={1}>
                      {prevText}
                    </Text>
                  </View>

                  <TextInput
                    style={[
                      styles.valueInput,
                      styles.colWeight,
                      set.isCustomWeight ? styles.inputValueCustom : styles.inputValueDefault,
                      set.completed && styles.inputDone,
                      isActive && styles.inputActive,
                    ]}
                    value={set.weight === 0 ? '' : String(set.weight)}
                    keyboardType="decimal-pad"
                    placeholder={placeholderWeight}
                    placeholderTextColor={colors.textMuted}
                    onChangeText={(t) => {
                      const clean = t.replace(',', '.');
                      const v = parseFloat(clean);
                      onUpdateSet(exercise.exerciseId, set.id, 'weight', isNaN(v) ? 0 : v);
                    }}
                  />

                  <TextInput
                    style={[
                      styles.repsInput,
                      styles.colReps,
                      set.isCustomReps ? styles.inputValueCustom : styles.inputValueDefault,
                      set.completed && styles.inputDone,
                      isActive && styles.inputActive,
                    ]}
                    value={set.reps === 0 ? '' : String(set.reps)}
                    keyboardType="number-pad"
                    placeholder={placeholderReps}
                    placeholderTextColor={colors.textMuted}
                    onChangeText={(t) => {
                      const v = parseInt(t, 10);
                      onUpdateSet(exercise.exerciseId, set.id, 'reps', isNaN(v) ? 0 : v);
                    }}
                  />

                  <Pressable
                    style={({ pressed }) => [
                      styles.checkBtn,
                      styles.colCheck,
                      set.completed ? styles.checkBtnDone : styles.checkBtnPending,
                      pressed && styles.checkBtnPressed,
                    ]}
                    onPress={() => onToggleSetCompleted(exercise.exerciseId, set.id)}
                    hitSlop={8}
                  >
                    <Icon
                      name="checkmark"
                      size="sm"
                      color={set.completed ? colors.white : colors.textMuted}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={styles.exFooter}>
        <Pressable
          onPress={() => onAddSet(exercise.exerciseId)}
          hitSlop={8}
          style={styles.addSetLink}
        >
          <Icon name="plus" size="sm" color={colors.textSecondary} />
          <Text style={styles.addSetText}>Adicionar série</Text>
        </Pressable>
        <Button
          title={exercise.completed ? 'Refazer exercício' : 'Concluir exercício'}
          variant={exercise.completed ? 'secondary' : 'primary'}
          onPress={() =>
            exercise.completed ? onReset(exercise.exerciseId) : onComplete(exercise.exerciseId)
          }
          style={styles.completeButton}
        />
      </View>
    </Card>
  );
}

/** Indicador compacto de blocos da técnica avançada: [x][ ][ ]. */
function BlockStrip({
  blocks,
  onToggle,
}: {
  blocks: WorkoutLogBlock[];
  onToggle: (order: number) => void;
}) {
  const done = blocks.filter((b) => b.completed).length;
  return (
    <View style={styles.blockStrip}>
      <View style={styles.blockStripHeader}>
        <Icon name="flash" size="xs" color={colors.primary} />
        <Text style={styles.blockStripLabel}>Blocos</Text>
        <Text style={styles.blockStripCount}>
          {done}/{blocks.length}
        </Text>
      </View>
      <View style={styles.blockDots}>
        {blocks.map((b) => (
          <Pressable
            key={b.order}
            onPress={() => onToggle(b.order)}
            hitSlop={8}
            style={[styles.blockDot, b.completed && styles.blockDotDone]}
          >
            <Text style={[styles.blockDotText, b.completed && styles.blockDotTextDone]}>
              {b.completed ? '✓' : b.order}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerOverline: {
    marginBottom: 2,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  headerCount: {
    color: colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  progressDetail: {
    marginTop: spacing.xs,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: 220,
  },
  listScroll: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  footerSecondary: {
    flex: 1,
  },
  footerPrimary: {
    flex: 1.4,
  },
  exCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  exCardDone: {
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  exTitleWrap: {
    flex: 1,
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  exName: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  exSubtitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  muscleText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  targetText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  execTechBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.scrim,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  execTechText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  lastResultText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  exHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.scrim,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    marginRight: spacing.xs,
  },
  completedPillText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  notesBox: {
    backgroundColor: colors.surfaceLighter,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  notesLabel: {
    marginBottom: spacing.xs,
  },
  notesInput: {
    color: colors.text,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  suggestionText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  suggestionTextProgress: {
    color: colors.primary,
  },
  blockStrip: {
    backgroundColor: colors.scrimSubtle,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  blockStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  blockStripLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  blockStripCount: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 'auto',
  },
  blockDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  blockDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockDotDone: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  blockDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  blockDotTextDone: {
    color: colors.white,
  },
  categoryBlock: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  categoryCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  setTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  setHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  colSet: {
    width: 26,
  },
  colPrev: {
    width: 66,
  },
  colWeight: {
    flex: 1,
  },
  colReps: {
    flex: 1,
  },
  colCheck: {
    width: 44,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderRadius: borderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  setRowDone: {
    backgroundColor: colors.successLight,
  },
  setRowActive: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
  },
  setNumber: {
    width: 26,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  setNumberDone: {
    color: colors.success,
  },
  prevCol: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  prevText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  valueInput: {
    height: 44,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  repsInput: {
    height: 44,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  inputValueDefault: {
    color: colors.textSecondary,
  },
  inputValueCustom: {
    color: colors.text,
  },
  inputDone: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
    color: colors.text,
  },
  inputActive: {
    borderColor: colors.primary,
  },
  checkBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkBtnPending: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderLight,
  },
  checkBtnDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkBtnPressed: {
    opacity: 0.7,
  },
  countdownModalBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  countdownIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  countdownOverline: {
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '800',
    letterSpacing: 1,
  },
  countdownTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.text,
  },
  countdownNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  countdownBigNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 76,
  },
  countdownNumberZero: {
    color: colors.primary,
  },
  countdownSecLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  countdownInfoText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  countdownActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalOverline: {
    color: colors.primary,
    marginBottom: 4,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 2,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalTargetCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  modalTargetCol: {
    alignItems: 'center',
  },
  modalTargetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalTargetVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalTargetDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
  },
  modalNotice: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  exFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  addSetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
  },
  addSetText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
  },
});
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
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
import { useWorkouts, useExercises } from '../hooks';
import { workoutLogService, workoutService, buildLog, exerciseService } from '../services';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';
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
  const [execExercises, setExecExercises] = useState<ExecutionExercise[]>([]);
  const [lastResults, setLastResults] = useState<Map<string, { weight: number; reps: number }[]>>(new Map());
  const [finishVisible, setFinishVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

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
  const totalSets = execExercises.reduce((acc, e) => acc + e.sets.length, 0);

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setExecExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s) => {
            if (s.id !== setId) return s;
            const next = { ...s, [field]: value };
            // Uma série é considerada feita quando peso e repetições são registrados.
            next.completed = next.weight > 0 && next.reps > 0;
            return next;
          }),
        };
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
        return {
          ...e,
          sets: e.sets.map((s) =>
            s.id === setId ? { ...s, weight: Math.max(0, Math.round((s.weight + delta) * 10) / 10) } : s,
          ),
        };
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
              reps: e.plannedReps,
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
          reps: 10,
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
    navigation.navigate('LogDetail', { logId: log.id });
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
            onUpdateSet={updateSet}
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
    </View>
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
  setExec: (v: ExecutionExercise[]) => void,
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
      weight: 0,
      reps: we.plannedReps,
      completed: false,
      type: seg.type,
      category: seg.category,
    }));
    // Aplica o peso inicial apenas na primeira série válida.
    const firstWorking = sets.findIndex((s) => (s.category ?? 'working') === 'working');
    if (firstWorking >= 0) {
      sets[firstWorking] = { ...sets[firstWorking], weight: initialWeight };
    } else if (sets.length > 0) {
      sets[0] = { ...sets[0], weight: initialWeight };
    }
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
      if (last) map.set(we.exerciseId, last);
    }
    setLast(map);
  })();
}

function WorkoutExerciseBlock({
  exercise,
  lastResult,
  onUpdateSet,
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
  onUpdateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => void;
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
            {sets.map((set) => (
              <View
                key={set.id}
                style={[styles.setRow, set.completed && styles.setRowDone]}
              >
                <Text style={[styles.setNumber, set.completed && styles.setNumberDone]}>
                  {set.setNumber}
                </Text>

                <View style={styles.weightControl}>
                  <Pressable
                    style={({ pressed }) => [styles.step, pressed && styles.stepPressed]}
                    onPress={() => onBumpWeight(exercise.exerciseId, set.id, -WEIGHT_STEP)}
                    disabled={set.completed}
                    hitSlop={6}
                  >
                    <Icon name="remove" size="sm" color={colors.textSecondary} />
                  </Pressable>
                  <TextInput
                    style={[styles.valueInput, set.completed && styles.inputDone]}
                    value={set.weight === 0 ? '' : String(set.weight)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    onChangeText={(t) => {
                      const v = parseInt(t, 10);
                      onUpdateSet(exercise.exerciseId, set.id, 'weight', isNaN(v) ? 0 : v);
                    }}
                    editable={!set.completed}
                  />
                  <Pressable
                    style={({ pressed }) => [styles.step, pressed && styles.stepPressed]}
                    onPress={() => onBumpWeight(exercise.exerciseId, set.id, WEIGHT_STEP)}
                    disabled={set.completed}
                    hitSlop={6}
                  >
                    <Icon name="add" size="sm" color={colors.textSecondary} />
                  </Pressable>
                </View>

                <TextInput
                  style={[styles.repsInput, set.completed && styles.inputDone]}
                  value={set.reps === 0 ? '' : String(set.reps)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={(t) => {
                    const v = parseInt(t, 10);
                    onUpdateSet(exercise.exerciseId, set.id, 'reps', isNaN(v) ? 0 : v);
                  }}
                  editable={!set.completed}
                />
              </View>
            ))}
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
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
  },
  setRowDone: {
    opacity: 0.6,
  },
  setNumber: {
    width: 30,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  setNumberDone: {
    color: colors.textSecondary,
  },
  weightControl: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  step: {
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stepPressed: {
    backgroundColor: colors.elevated,
  },
  valueInput: {
    flex: 1,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    textAlign: 'center',
    height: 44,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  repsInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    textAlign: 'center',
    height: 44,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  inputDone: {
    opacity: 0.5,
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
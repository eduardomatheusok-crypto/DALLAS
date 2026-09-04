import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Card, Button, LoadingState, Screen, ScreenHeader } from '../components/common';
import ExercisePickerModal from '../components/common/ExercisePickerModal';
import { useExercises, useWorkouts } from '../hooks';
import { workoutService, exerciseService } from '../services';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';
import type { Exercise, WorkoutExercisePlan, AdvancedTechnique } from '../models';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = {
  key: string;
  name: string;
  params: { workoutId?: string };
};

interface DraftExercise {
  key: string;
  exerciseId: string;
  plannedSets: number;
  plannedReps: number;
  initialWeight?: number;
  warmupSets?: number;
  preparationSets?: number;
  workingSets?: number;
  advancedTechnique?: AdvancedTechnique;
}

export default function WorkoutFormScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const workoutId = route.params?.workoutId;

  const { workouts, loading } = useWorkouts();
  const { exercises, reload: reloadExercises } = useExercises();

  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState<DraftExercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workoutId) {
      const w = workouts.find((x) => x.id === workoutId);
      if (w) {
        setName(w.name);
        setDrafts(
          [...w.exercises]
            .sort((a, b) => a.order - b.order)
            .map((e) => ({
              key: `${e.exerciseId}-${e.order}`,
              exerciseId: e.exerciseId,
              plannedSets: e.plannedSets,
              plannedReps: e.plannedReps,
              initialWeight: e.initialWeight,
              warmupSets: e.warmupSets,
              preparationSets: e.preparationSets,
              workingSets: e.workingSets,
              advancedTechnique: e.advancedTechnique,
            })),
        );
      }
    }
  }, [workoutId, workouts]);

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises.forEach((e) => map.set(e.id, e));
    return map;
  }, [exercises]);

  const addExercise = (exercise: Exercise) => {
    setDrafts((prev) => [
      ...prev,
      {
        key: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        plannedSets: 3,
        plannedReps: 10,
      },
    ]);
    setPickerVisible(false);
  };

  const removeExercise = (key: string) => {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  };

  const updateField = (key: string, field: keyof DraftExercise, value: number) => {
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, [field]: value } : d)),
    );
  };

  const move = (index: number, dir: -1 | 1) => {
    setDrafts((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    if (!name.trim() || drafts.length === 0) return;
    setSaving(true);
    const plans: WorkoutExercisePlan[] = drafts.map((d, i) => ({
      exerciseId: d.exerciseId,
      order: i + 1,
      plannedSets: Math.max(1, d.plannedSets),
      plannedReps: Math.max(1, d.plannedReps),
      initialWeight: d.initialWeight && d.initialWeight > 0 ? d.initialWeight : undefined,
      warmupSets: d.warmupSets,
      preparationSets: d.preparationSets,
      workingSets: d.workingSets,
      advancedTechnique: d.advancedTechnique,
    }));
    await workoutService.saveWorkout(name, plans, workoutId);
    setSaving(false);
    navigation.goBack();
  };

  if (loading) return <Screen><LoadingState /></Screen>;

  return (
    <Screen>
      <ScreenHeader
        overline={workoutId ? 'Editar' : 'Novo'}
        title={workoutId ? 'Editar treino' : 'Novo treino'}
      />

      <TextInput
        style={styles.nameInput}
        placeholder="Nome do treino"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={[typography.label, styles.sectionLabel]}>Exercícios</Text>

      <FlatList
        data={drafts}
        keyExtractor={(item) => item.key}
        style={styles.list}
        ListEmptyComponent={
          <Text style={[typography.caption, styles.emptyHint]}>
            Adicione exercícios ao seu treino.
          </Text>
        }
        renderItem={({ item, index }) => {
          const ex = exerciseMap.get(item.exerciseId);
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[typography.body, styles.cardTitle]} numberOfLines={1}>
                  {ex?.name ?? 'Exercício'}
                </Text>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => move(index, -1)} hitSlop={8} style={styles.actionButton}>
                    <Icon name="arrow-up" size="sm" color={colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => move(index, 1)} hitSlop={8} style={styles.actionButton}>
                    <Icon name="arrow-down" size="sm" color={colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => removeExercise(item.key)} hitSlop={8} style={styles.actionButton}>
                    <Icon name="trash" size="sm" color={colors.danger} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.fields}>
                <NumberField
                  label="Séries"
                  value={item.plannedSets}
                  onChange={(v) => updateField(item.key, 'plannedSets', v)}
                />
                <NumberField
                  label="Reps"
                  value={item.plannedReps}
                  onChange={(v) => updateField(item.key, 'plannedReps', v)}
                />
                <NumberField
                  label="Peso (kg)"
                  value={item.initialWeight ?? 0}
                  onChange={(v) => updateField(item.key, 'initialWeight', v)}
                  allowZero
                />
              </View>
            </Card>
          );
        }}
      />

      <Button
        title="+ Adicionar exercício"
        variant="secondary"
        onPress={() => setPickerVisible(true)}
        style={styles.addButton}
      />

      <View style={styles.footer}>
        <Button
          title="Salvar treino"
          onPress={save}
          loading={saving}
          disabled={!name.trim() || drafts.length === 0}
        />
      </View>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAdd={addExercise}
        selectedIds={drafts.map((d) => d.exerciseId)}
        onCreateCustom={async (name, group) => {
          const created = await exerciseService.createCustom(name, group);
          await reloadExercises();
          return created;
        }}
      />
    </Screen>
  );
}

function NumberField({
  label,
  value,
  onChange,
  allowZero = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  allowZero?: boolean;
}) {
  const [text, setText] = useState(value === 0 && allowZero ? '' : String(value));

  useEffect(() => {
    setText(value === 0 && allowZero ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const submit = () => {
    const parsed = parseInt(text, 10);
    if (isNaN(parsed)) {
      onChange(allowZero ? 0 : 1);
      setText(allowZero ? '' : '1');
      return;
    }
    onChange(parsed);
  };

  return (
    <View style={styles.field}>
      <Text style={typography.caption}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={text}
        onChangeText={setText}
        keyboardType="number-pad"
        onBlur={submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nameInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    marginTop: spacing.lg,
    fontSize: 16,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  emptyHint: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  card: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: spacing.md,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
    textAlign: 'center',
    fontSize: 16,
  },
  addButton: {
    marginTop: spacing.lg,
  },
  footer: {
    marginTop: spacing.lg,
  },
});

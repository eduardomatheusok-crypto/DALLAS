import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Card,
  Button,
  LoadingState,
  EmptyState,
  Stepper,
  ExercisePickerModal,
  TechniquePickerModal,
  Section,
} from '../components/common';
import Screen from '../components/common/Screen';
import { useWorkouts, useExercises } from '../hooks';
import { workoutService } from '../services';
import { colors, spacing, borderRadius, typography, SET_CATEGORY_THEME } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';
import type {
  AdvancedTechnique,
  AdvancedTechniqueKind,
  AdvancedTechniqueExercise,
  SetCategory,
} from '../models';
import {
  planWorkingSets,
  planWarmupSets,
  planPreparationSets,
  ADVANCED_TECHNIQUE_META,
  isCompositeTechnique,
  techniqueName,
  type WorkoutExercisePlan,
} from '../models';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = {
  key: string;
  name: string;
  params: { workoutId: string; exerciseId: string };
};

const CATEGORY_ROWS: { category: SetCategory; title: string; hint: string }[] = [
  {
    category: 'warmup',
    title: 'Aquecimento',
    hint: 'Não entra nas métricas principais.',
  },
  {
    category: 'preparation',
    title: 'Preparatórias',
    hint: 'Preparam para as séries válidas.',
  },
  {
    category: 'working',
    title: 'Válidas',
    hint: 'Contam para volume e desempenho.',
  },
];

export default function WorkoutExerciseConfigScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { workoutId, exerciseId } = route.params;

  const { workouts, loading: wLoading, reload: reloadWorkouts } = useWorkouts();
  const { exercises } = useExercises();

  const [warmup, setWarmup] = useState<number | null>(null);
  const [preparation, setPreparation] = useState<number | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const [technique, setTechnique] = useState<AdvancedTechnique | null>(null);
  const [techniquePicker, setTechniquePicker] = useState(false);
  const [exercisePicker, setExercisePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const workout = useMemo(() => workouts.find((w) => w.id === workoutId), [workouts, workoutId]);
  const plan = useMemo<WorkoutExercisePlan | undefined>(
    () => workout?.exercises.find((e) => e.exerciseId === exerciseId),
    [workout, exerciseId],
  );
  const exercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId),
    [exercises, exerciseId],
  );

  useEffect(() => {
    if (!plan) return;
    if (warmup === null || preparation === null || working === null) {
      setWarmup(planWarmupSets(plan));
      setPreparation(planPreparationSets(plan));
      setWorking(planWorkingSets(plan));
    }
    if (technique === null) {
      setTechnique(plan.advancedTechnique ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.exerciseId, plan?.order]);

  if (wLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (!workout || !plan) {
    return (
      <Screen>
        <EmptyState icon="error" title="Exercício não encontrado" />
      </Screen>
    );
  }

  const total = (warmup ?? 0) + (preparation ?? 0) + (working ?? 0);
  const techniqueKind = (technique?.kind ?? 'none') as AdvancedTechniqueKind;
  const compositeExercises = (technique?.exercises ?? []) as AdvancedTechniqueExercise[];

  const changeTechniqueKind = (kind: AdvancedTechniqueKind) => {
    if (kind === 'none') {
      setTechnique(null);
      return;
    }
    const meta = ADVANCED_TECHNIQUE_META[kind];
    if (meta.composition === 'multi') {
      const ordered = [...workout.exercises].sort((a, b) => a.order - b.order);
      const others = ordered
        .filter((p) => p.exerciseId !== exerciseId)
        .map((p, i) => ({ exerciseId: p.exerciseId, order: i + 1 }));
      setTechnique({
        kind,
        exercises: others.slice(0, meta.maxExercises).map((o) => ({
          ...o,
          exerciseName: exercises.find((e) => e.id === o.exerciseId)?.name,
        })),
      });
    } else {
      setTechnique({ kind });
    }
  };

  const updateTechniqueConfig = (key: string, value: number) => {
    setTechnique((prev) =>
      prev ? { ...prev, config: { ...(prev.config ?? {}), [key]: value } } : prev,
    );
  };

  const updateCompositeOrder = (index: number, dir: -1 | 1) => {
    setTechnique((prev) => {
      if (!prev) return prev;
      const arr = [...(prev.exercises ?? [])];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...prev, exercises: arr.map((e, i) => ({ ...e, order: i + 1 })) };
    });
  };

  const updateCompositeBlocks = (index: number, value: number) => {
    setTechnique((prev) => {
      if (!prev) return prev;
      const arr = [...(prev.exercises ?? [])];
      arr[index] = { ...arr[index], blocks: value };
      return { ...prev, exercises: arr };
    });
  };

  const removeComposite = (index: number) => {
    setTechnique((prev) => {
      if (!prev) return prev;
      const next = (prev.exercises ?? []).filter((_, i) => i !== index).map((e, i) => ({ ...e, order: i + 1 }));
      return { ...prev, exercises: next };
    });
  };

  const addComposite = (ex: { id: string; name: string }) => {
    setTechnique((prev) => {
      if (!prev) return prev;
      const exists = (prev.exercises ?? []).some((e) => e.exerciseId === ex.id);
      if (exists) return prev;
      const arr = [
        ...(prev.exercises ?? []),
        {
          exerciseId: ex.id,
          exerciseName: ex.name,
          order: (prev.exercises?.length ?? 0) + 1,
        },
      ];
      return { ...prev, exercises: arr };
    });
    setExercisePicker(false);
  };

  const onSave = async () => {
    setSaving(true);
    await workoutService.updateExerciseConfig(workoutId, exerciseId, {
      warmupSets: warmup ?? 0,
      preparationSets: preparation ?? 0,
      workingSets: working ?? 0,
      advancedTechnique: techniqueKind === 'none' ? { kind: 'none' } : (technique ?? undefined),
    });
    await reloadWorkouts();
    setSaving(false);
    navigation.goBack();
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[typography.overline, styles.overline]}>Configurar exercício</Text>
          <Text style={typography.title}>{exercise?.name ?? 'Exercício'}</Text>
          <Text style={[typography.caption, styles.groupText]}>{exercise?.muscleGroup}</Text>
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total de séries</Text>
        <Text style={styles.totalValue}>{total}</Text>
      </View>

      <Section title="Séries">
        <Card style={styles.seriesCard} padded={false}>
          {CATEGORY_ROWS.map((row, i) => {
            const theme = SET_CATEGORY_THEME[row.category];
            const value =
              row.category === 'warmup'
                ? (warmup ?? 0)
                : row.category === 'preparation'
                  ? (preparation ?? 0)
                  : (working ?? 0);
            const setValue = (v: number) => {
              if (row.category === 'warmup') setWarmup(v);
              else if (row.category === 'preparation') setPreparation(v);
              else setWorking(v);
            };
            return (
              <View key={row.category} style={[styles.seriesRow, i > 0 && styles.seriesRowBorder]}>
                <View style={styles.seriesInfo}>
                  <View style={[styles.catBar, { backgroundColor: theme.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, styles.seriesTitle]}>{row.title}</Text>
                    <Text style={[typography.caption, styles.seriesHint]}>{row.hint}</Text>
                  </View>
                </View>
                <Stepper
                  value={value}
                  onChange={setValue}
                  accent={theme.accent}
                  accentLight={theme.accentLight}
                />
              </View>
            );
          })}
        </Card>
      </Section>

      <Section title="Técnica avançada">
        <Card style={styles.techniqueCard} padded={false}>
          <Pressable
            style={({ pressed }) => [styles.techniqueRow, pressed && styles.pressed]}
            onPress={() => setTechniquePicker(true)}
          >
            <View style={styles.techniqueInfo}>
              <View style={styles.techniqueIconWrap}>
                <Icon name="flash" size="sm" color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    typography.body,
                    { color: techniqueKind === 'none' ? colors.textSecondary : colors.text },
                  ]}
                >
                  {techniqueName(techniqueKind)}
                </Text>
                <Text style={[typography.caption, styles.techniqueHint]}>
                  {techniqueKind === 'none'
                    ? 'Toque para selecionar'
                    : ADVANCED_TECHNIQUE_META[techniqueKind].description}
                </Text>
              </View>
            </View>
            <Icon name="chevronRight" size="sm" color={colors.textSecondary} />
          </Pressable>

          <TechniqueConfig technique={technique} onChangeConfig={updateTechniqueConfig} />

          {isCompositeTechnique(techniqueKind) ? (
            <View style={styles.compositeArea}>
              <Text style={[typography.caption, styles.compositeHint]}>
                Monte a sequência de exercícios da{' '}
                {ADVANCED_TECHNIQUE_META[techniqueKind].label}:
              </Text>
              {compositeExercises.length === 0 ? (
                <Text style={[typography.small, styles.compositeEmpty]}>
                  Nenhum exercício na combinação.
                </Text>
              ) : (
                compositeExercises.map((ce, idx) => (
                  <View key={`${ce.exerciseId}-${idx}`} style={styles.compositeItem}>
                    <View style={styles.compositeRow}>
                      <View style={styles.compositeIndex}>
                        <Text style={styles.compositeIndexText}>{idx + 1}</Text>
                      </View>
                      <Text style={[typography.body, styles.compositeName]} numberOfLines={1}>
                        {ce.exerciseName ?? 'Exercício'}
                      </Text>
                      <Pressable
                        onPress={() => updateCompositeOrder(idx, -1)}
                        hitSlop={8}
                        style={styles.smallAction}
                      >
                        <Icon name="arrowUp" size="sm" color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => updateCompositeOrder(idx, 1)}
                        hitSlop={8}
                        style={styles.smallAction}
                      >
                        <Icon name="arrowDown" size="sm" color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => removeComposite(idx)}
                        hitSlop={8}
                        style={styles.smallAction}
                      >
                        <Icon name="trash" size="sm" color={colors.danger} />
                      </Pressable>
                    </View>
                    <View style={styles.compositeBlocksRow}>
                      <Text style={[typography.small, styles.compositeBlocksLabel]}>Blocos</Text>
                      <Stepper
                        value={ce.blocks ?? 0}
                        onChange={(v) => updateCompositeBlocks(idx, v)}
                        min={0}
                        max={10}
                        accent={colors.text}
                        accentLight={colors.border}
                      />
                    </View>
                  </View>
                ))
              )}
              <Button
                title="+ Adicionar exercício"
                variant="secondary"
                compact
                icon="plus"
                onPress={() => setExercisePicker(true)}
              />
            </View>
          ) : null}
        </Card>
      </Section>

      <View style={styles.footer}>
        <Button title="Salvar" onPress={onSave} loading={saving} disabled={saving} />
      </View>

      <TechniquePickerModal
        visible={techniquePicker}
        selected={techniqueKind}
        onSelect={changeTechniqueKind}
        onClose={() => setTechniquePicker(false)}
      />

      <ExercisePickerModal
        visible={exercisePicker}
        onClose={() => setExercisePicker(false)}
        onAdd={addComposite}
        selectedIds={compositeExercises.map((e) => e.exerciseId)}
      />
    </Screen>
  );
}

// Configurações específicas de cada técnica de exercício único.
// Arquitetura extensível: basta acrescentar entradas se uma nova técnica
// precisar de campos próprios.
const TECHNIQUE_CONFIG_FIELDS: Record<
  string,
  { key: string; label: string; default: number; min: number; max: number }[]
> = {
  myo: [
    { key: 'activationReps', label: 'Reps na ativação', default: 12, min: 1, max: 30 },
    { key: 'miniSets', label: 'Mini séries', default: 3, min: 1, max: 10 },
    { key: 'miniReps', label: 'Reps por mini série', default: 4, min: 1, max: 20 },
    { key: 'restSeconds', label: 'Descanso (s)', default: 20, min: 5, max: 120 },
  ],
  cluster: [
    { key: 'miniReps', label: 'Reps por cluster', default: 4, min: 1, max: 15 },
    { key: 'restSeconds', label: 'Pausa entre clusters (s)', default: 15, min: 5, max: 120 },
    { key: 'clusters', label: 'Clusters', default: 3, min: 1, max: 8 },
  ],
  'rest-pause': [
    { key: 'restSeconds', label: 'Pausa (s)', default: 15, min: 5, max: 120 },
    { key: 'pauses', label: 'Pausas por série', default: 2, min: 1, max: 8 },
  ],
  'drop-set': [
    { key: 'drops', label: 'Qtd. de drops', default: 2, min: 1, max: 5 },
    { key: 'dropPct', label: 'Redução por drop (%)', default: 20, min: 5, max: 50 },
  ],
};

function TechniqueConfig({
  technique,
  onChangeConfig,
}: {
  technique: AdvancedTechnique | null;
  onChangeConfig: (key: string, value: number) => void;
}) {
  const kind = (technique?.kind ?? 'none') as AdvancedTechniqueKind;
  if (kind === 'none' || isCompositeTechnique(kind)) return null;

  const fields = TECHNIQUE_CONFIG_FIELDS[kind];
  if (!fields) return null;

  const config = technique?.config ?? {};
  const resolved = fields.map((f) => ({
    ...f,
    value: typeof config[f.key] === 'number' ? (config[f.key] as number) : f.default,
  }));

  const blocksValue = typeof config.blocks === 'number' ? (config.blocks as number) : 0;

  return (
    <View style={styles.techConfigArea}>
      <Text style={[typography.label, styles.techConfigTitle]}>
        Configurações de {techniqueName(kind)}
      </Text>
      <View style={styles.techConfigRow}>
        <Text style={[typography.bodySecondary, styles.techConfigLabel]}>{'Blocos'}</Text>
        <Stepper
          value={blocksValue}
          onChange={(v) => onChangeConfig('blocks', v)}
          min={0}
          max={10}
          accent={colors.text}
          accentLight={colors.border}
        />
      </View>
      {resolved.map((f) => (
        <View key={f.key} style={styles.techConfigRow}>
          <Text style={[typography.bodySecondary, styles.techConfigLabel]}>{f.label}</Text>
          <Stepper
            value={f.value}
            onChange={(v) => onChangeConfig(f.key, v)}
            min={f.min}
            max={f.max}
            accent={colors.text}
            accentLight={colors.border}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  titleWrap: {
    gap: spacing.xs,
  },
  overline: {
    marginBottom: spacing.xs,
  },
  groupText: {
    color: colors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xxl,
  },
  totalLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  seriesCard: {
    padding: spacing.md,
  },
  seriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  seriesRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  seriesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  catBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  seriesTitle: {
    fontWeight: '600',
  },
  seriesHint: {
    marginTop: 2,
  },
  techniqueCard: {
    overflow: 'hidden',
  },
  techniqueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  techniqueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  techniqueIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techniqueHint: {
    marginTop: 2,
  },
  techConfigArea: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: spacing.lg,
    marginLeft: spacing.lg,
  },
  techConfigTitle: {
    marginBottom: spacing.md,
  },
  techConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  techConfigLabel: {
    flex: 1,
  },
  compositeArea: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: spacing.lg,
  },
  compositeHint: {
    marginBottom: spacing.md,
  },
  compositeEmpty: {
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
  compositeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  compositeItem: {
    marginBottom: spacing.sm,
  },
  compositeBlocksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceLighter,
    borderBottomLeftRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
  },
  compositeBlocksLabel: {
    color: colors.textSecondary,
  },
  compositeIndex: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compositeIndexText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  compositeName: {
    flex: 1,
  },
  smallAction: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    marginTop: spacing.xl,
  },
});
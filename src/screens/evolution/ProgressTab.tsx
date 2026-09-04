import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Card, EmptyState, LoadingState } from '../../components/common';
import { useExercises, useWorkoutLogs } from '../../hooks';
import { workoutLogService } from '../../services';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Icon } from '../../theme/icons';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

interface ExerciseStat {
  exerciseId: string;
  name: string;
  maxWeight: number;
  maxReps: number;
  volume: number;
  lastWeight: number;
  lastReps: number;
  records: number;
}

export default function ProgressTab() {
  const navigation = useNavigation<Nav>();
  const { exercises } = useExercises();
  const { logs } = useWorkoutLogs();
  const [stats, setStats] = useState<ExerciseStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const items: ExerciseStat[] = [];
      for (const ex of exercises) {
        const history = await workoutLogService.getHistoryByExercise(ex.id);
        if (history.length === 0) continue;
        let maxWeight = 0;
        let maxReps = 0;
        let volume = 0;
        for (const h of history) {
          maxWeight = Math.max(maxWeight, h.maxWeight);
          maxReps = Math.max(maxReps, h.maxReps);
          volume += h.volume;
        }
        const last = history[history.length - 1];
        items.push({
          exerciseId: ex.id,
          name: ex.name,
          maxWeight,
          maxReps,
          volume,
          lastWeight: last.maxWeight,
          lastReps: last.maxReps,
          records: history.length,
        });
      }
      items.sort((a, b) => b.volume - a.volume);
      setStats(items);
      setLoading(false);
    })();
  }, [exercises, logs]);

  const totalVolume = stats.reduce((acc, s) => acc + s.volume, 0);
  const totalRecords = stats.length;
  const best = stats.reduce<ExerciseStat | null>(
    (acc, s) => (!acc || s.maxWeight > acc.maxWeight ? s : acc),
    null,
  );

  if (loading) return <LoadingState />;

  return (
    <FlatList
      data={stats}
      keyExtractor={(item) => item.exerciseId}
      style={styles.listScroll}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        stats.length > 0 ? (
          <View style={[styles.summary, shadows.card]}>
            <Text style={[typography.overline, styles.summaryLabel]}>Seu resumo</Text>
            <Text style={styles.summaryValue}>{fmtVol(totalVolume)} kg</Text>
            <View style={styles.summaryRow}>
              <SummaryChip label="exercícios" value={`${totalRecords}`} />
              <SummaryChip label="maior carga" value={`${best ? best.maxWeight : 0}kg`} />
              <SummaryChip label="treinos" value={`${logs.length}`} />
            </View>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="trendUp"
          title="SEM DADOS AINDA"
          message="Complete alguns treinos para ver sua evolução de força e volume."
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            navigation.navigate('ExerciseProgress', {
              exerciseId: item.exerciseId,
              name: item.name,
            })
          }
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={[typography.body, styles.exName]}>{item.name}</Text>
                <Text style={styles.last}>
                  Último: {item.lastWeight} kg × {item.lastReps} · {item.records}{' '}
                  registro(s)
                </Text>
              </View>
              <View style={styles.best}>
                <Text style={styles.bestValue}>{item.maxWeight} kg</Text>
                <Text style={styles.bestLabel}>maior peso</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.miniStats}>
              <MiniStat label="Máx reps" value={`${item.maxReps}`} />
              <MiniStat label="Volume" value={fmtVol(item.volume)} />
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[typography.body, styles.miniValue]}>{value}</Text>
      <Text style={typography.small}>{label}</Text>
    </View>
  );
}

function fmtVol(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return `${v}`;
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  listScroll: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  summary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  summaryLabel: {
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  chipValue: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  exName: {
    fontWeight: '600',
  },
  last: {
    color: colors.textSecondary,
  },
  best: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginLeft: spacing.md,
  },
  bestValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  bestLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  miniStats: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginTop: spacing.xs,
  },
  miniStat: {
    gap: spacing.xs,
  },
  miniValue: {
    color: colors.text,
  },
});
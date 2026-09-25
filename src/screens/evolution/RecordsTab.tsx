import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { EmptyState, LoadingState } from '../../components/common';
import { useExercises, useWorkoutLogs } from '../../hooks';
import { colors, spacing, borderRadius } from '../../theme';
import { Icon } from '../../theme/icons';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

interface PRItem {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  maxWeight: number;
  maxReps: number;
  date?: string;
}

export default function RecordsTab() {
  const navigation = useNavigation<Nav>();
  const { logs, loading: logsLoading } = useWorkoutLogs();
  const { exercises, loading: exLoading } = useExercises();

  const records = useMemo(() => {
    const map = new Map<string, PRItem>();

    for (const log of logs) {
      for (const ex of log.exercises) {
        let maxWeight = 0;
        let maxReps = 0;

        for (const s of ex.sets) {
          if (s.completed) {
            if (s.weight > maxWeight) {
              maxWeight = s.weight;
              maxReps = s.reps;
            } else if (s.weight === maxWeight && s.reps > maxReps) {
              maxReps = s.reps;
            }
          }
        }

        if (maxWeight > 0) {
          const current = map.get(ex.exerciseId);
          if (!current || maxWeight > current.maxWeight) {
            const catalog = exercises.find((e) => e.id === ex.exerciseId || e.name === ex.exerciseId);
            map.set(ex.exerciseId, {
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName || catalog?.name || 'Exercício',
              muscleGroup: catalog?.muscleGroup,
              maxWeight,
              maxReps,
              date: log.startedAt,
            });
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.maxWeight - a.maxWeight);
  }, [logs, exercises]);

  if (logsLoading || exLoading) return <LoadingState />;

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => item.exerciseId}
      style={styles.listScroll}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        records.length > 0 ? (
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>Recordes Pessoais (PR)</Text>
            <Text style={styles.headerSubtitle}>
              Suas melhores cargas registradas em cada exercício
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="trophy"
          title="AINDA NÃO HÁ RECORDES"
          message="Complete treinos para registrar suas maiores cargas e acompanhar suas marcas."
        />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.trophyBadge}>
            <Icon name="trophy" size="sm" color="#FF1E27" />
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.exerciseName}
            </Text>
            {item.muscleGroup ? (
              <Text style={styles.muscle}>{item.muscleGroup}</Text>
            ) : null}
          </View>

          <View style={styles.weightBadge}>
            <Text style={styles.weightValue}>{item.maxWeight} kg</Text>
            <Text style={styles.repsValue}>{item.maxReps} reps</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listScroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  headerBox: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
    gap: spacing.md,
  },
  trophyBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 30, 39, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.25)',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  muscle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  weightBadge: {
    alignItems: 'flex-end',
  },
  weightValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF1E27',
  },
  repsValue: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
});

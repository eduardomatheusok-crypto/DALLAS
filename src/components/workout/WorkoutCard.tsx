import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../common';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import type { Workout, Exercise } from '../../models';
import { planTotalSets } from '../../models';

interface Props {
  workout: Workout;
  exercises: Exercise[];
  onPress: () => void;
  onMenu?: () => void;
}

export default function WorkoutCard({ workout, exercises, onPress, onMenu }: Props) {
  const ordered = [...workout.exercises].sort((a, b) => a.order - b.order);

  const names = ordered
    .map((we) => exercises.find((e) => e.id === we.exerciseId)?.name ?? 'Exercício')
    .slice(0, 3)
    .join(' · ');

  const muscles = Array.from(
    new Set(
      ordered
        .map((we) => exercises.find((e) => e.id === we.exerciseId)?.muscleGroup)
        .filter(Boolean) as string[],
    ),
  ).slice(0, 3);

  const totalSets = ordered.reduce((acc, we) => acc + planTotalSets(we), 0);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={styles.top}>
          <View style={styles.titleWrap}>
            <Text style={typography.subtitle} numberOfLines={1}>
              {workout.name}
            </Text>
            {names ? (
              <Text style={styles.names} numberOfLines={1}>
                {names}
              </Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <Text style={styles.meta}>
              {ordered.length} exercícios · {totalSets} séries
            </Text>
            {onMenu ? (
              <Pressable onPress={onMenu} hitSlop={10} style={styles.menuBtn}>
                <Icon name="menuVertical" size="xs" color={colors.textSecondary} />
              </Pressable>
            ) : (
              <Icon name="chevronRight" size="sm" color={colors.textMuted} />
            )}
          </View>
        </View>

        {muscles.length > 0 ? (
          <View style={styles.muscles}>
            {muscles.map((m) => (
              <View key={m} style={styles.muscleChip}>
                <Text style={styles.muscleText}>{m}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  card: {
    padding: spacing.lg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  names: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  muscleChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  muscleText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
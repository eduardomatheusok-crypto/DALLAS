import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../common';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import type { Workout, Exercise } from '../../models';
import { planTotalSets } from '../../models';
import { findExerciseByIdOrName } from '../../services';

const upperImg = require('../../../assets/images/muscle_upper.jpg');
const lowerImg = require('../../../assets/images/muscle_lower.jpg');

interface Props {
  workout: Workout;
  exercises: Exercise[];
  onPress: () => void;
  onMenu?: () => void;
}

export default function WorkoutCard({ workout, exercises, onPress, onMenu }: Props) {
  const ordered = [...workout.exercises].sort((a, b) => a.order - b.order);

  const muscles = Array.from(
    new Set(
      ordered
        .map((we) => findExerciseByIdOrName(exercises, we.exerciseId)?.muscleGroup)
        .filter(Boolean) as string[],
    ),
  );

  const totalSets = ordered.reduce((acc, we) => acc + planTotalSets(we), 0);

  // Check if it's primarily a lower body workout
  const isLower = muscles.some((m) =>
    /perna|quadr|glút|panturr|inferior/i.test(m),
  );
  const thumbSource = isLower ? lowerImg : upperImg;

  const muscleDisplay = muscles.slice(0, 3).join(' • ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={styles.contentRow}>
          {/* Muscle Thumbnail */}
          <View style={styles.thumbContainer}>
            <Image source={thumbSource} style={styles.thumb} resizeMode="cover" />
            <View style={styles.thumbOverlay} />
          </View>

          {/* Details */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {workout.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {ordered.length} exercícios • {totalSets} séries
            </Text>
            {muscleDisplay ? (
              <Text style={styles.muscles} numberOfLines={1}>
                {muscleDisplay}
              </Text>
            ) : null}
          </View>

          {/* Action Menu */}
          {onMenu ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onMenu();
              }}
              hitSlop={12}
              style={styles.menuBtn}
            >
              <Icon name="menuVertical" size="xs" color={colors.textSecondary} />
            </Pressable>
          ) : (
            <Icon name="chevronRight" size="sm" color={colors.textMuted} />
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  card: {
    padding: spacing.md,
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbContainer: {
    width: 62,
    height: 62,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1C20',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.25)',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  muscles: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import type { MuscleGroup } from '../../models';

interface Props {
  label: MuscleGroup | 'Todos';
  active: boolean;
  onPress: () => void;
}

export default function MuscleGroupPill({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.active,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.white,
    fontWeight: '600',
  },
});

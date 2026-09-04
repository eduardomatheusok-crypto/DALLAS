import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import type { AppIconName } from '../../theme/icons';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Cor de destaque (padrão: primary/vermelho). */
  accent?: string;
  accentLight?: string;
}

const MINUS: AppIconName = 'remove';
const PLUS: AppIconName = 'add';

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  accent = colors.primary,
  accentLight = colors.scrimSubtle,
}: StepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={atMin}
        style={({ pressed }) => [
          styles.button,
          { borderColor: atMin ? colors.border : accentLight },
          atMin && styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
        hitSlop={6}
      >
        <Icon name={MINUS} size="sm" color={atMin ? colors.textMuted : accent} />
      </Pressable>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={atMax}
        style={({ pressed }) => [
          styles.button,
          { borderColor: atMax ? colors.border : accentLight },
          atMax && styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
        hitSlop={6}
      >
        <Icon name={PLUS} size="sm" color={atMax ? colors.textMuted : accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  value: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
});

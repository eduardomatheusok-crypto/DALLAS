import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  variant?: 'default' | 'pill';
  style?: object;
}

export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  variant = 'default',
  style,
}: Props<T>) {
  const isPill = variant === 'pill';

  return (
    <View style={[styles.container, isPill && styles.pillContainer, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.option,
              isPill && styles.pillOption,
              active && (isPill ? styles.pillOptionActive : styles.optionActive),
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={[
                styles.label,
                isPill && styles.pillLabel,
                active && (isPill ? styles.pillLabelActive : styles.labelActive),
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#141416',
    borderRadius: borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: '#242428',
    marginBottom: spacing.lg,
  },
  pillContainer: {
    backgroundColor: '#121214',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: '#202024',
    marginBottom: spacing.md,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  pillOption: {
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  optionActive: {
    backgroundColor: colors.elevated,
  },
  pillOptionActive: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pillLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  labelActive: {
    color: colors.white,
    fontWeight: '700',
  },
  pillLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
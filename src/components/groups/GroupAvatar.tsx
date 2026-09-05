import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props {
  emoji: string;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const SIZE: Record<'sm' | 'md' | 'lg', { box: number; font: number }> = {
  sm: { box: 36, font: 18 },
  md: { box: 48, font: 24 },
  lg: { box: 64, font: 32 },
};

export default function GroupAvatar({ emoji, size = 'md', style }: Props) {
  const dim = SIZE[size];
  return (
    <View
      style={[
        styles.box,
        { width: dim.box, height: dim.box, borderRadius: borderRadius.md },
        style,
      ]}
    >
      <Text style={[styles.emoji, { fontSize: dim.font }]}>{emoji || '🏋️'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    ...typography.heroTitle,
  },
});
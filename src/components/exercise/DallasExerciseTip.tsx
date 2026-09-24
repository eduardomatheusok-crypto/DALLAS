import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../../theme';

interface DallasExerciseTipProps {
  tip?: string;
  style?: ViewStyle;
}

const MASCOT_IMG = require('../../../assets/dallas/dallas_base.png');

export default function DallasExerciseTip({ tip, style }: DallasExerciseTipProps) {
  if (!tip) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.avatarWrapper}>
        <Image source={MASCOT_IMG} style={styles.avatar} resizeMode="contain" />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>Dica do Dallas</Text>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.25)', // Borda sutil avermelhada do Dallas
    gap: spacing.sm,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLighter,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatar: {
    width: 38,
    height: 38,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tipText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
});

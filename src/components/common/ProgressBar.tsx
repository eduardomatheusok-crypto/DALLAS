import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, borderRadius } from '../../theme';

interface Props {
  progress: number; // 0..1
  color?: string;
}

export default function ProgressBar({ progress, color = colors.primary }: Props) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={styles.track}>
      {clamped > 0 ? (
        <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLighter,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});

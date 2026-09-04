import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  style?: object;
}

export default function Section({ title, children, right, style }: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title || right ? (
        <View style={styles.header}>
          {title ? <Text style={[typography.label, styles.title]}>{title}</Text> : null}
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    letterSpacing: 1.4,
  },
});
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface ScreenHeaderProps {
  overline?: string;
  title: string;
  right?: React.ReactNode;
}

export default function ScreenHeader({ overline, title, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.textWrap}>
        {overline ? <Text style={typography.overline}>{overline}</Text> : null}
        <Text style={[typography.heroTitle, styles.title]}>{title}</Text>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  textWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    textTransform: 'uppercase',
  },
  right: {
    marginLeft: spacing.md,
  },
});
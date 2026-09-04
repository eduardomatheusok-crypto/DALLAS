import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon, type IconName, type AppIconName } from '../../theme/icons';
import { Button } from './Button';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[typography.bodySecondary, styles.text]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon = 'empty',
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  icon?: IconName | AppIconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={26} color={colors.textMuted} />
      </View>
      <Text style={[typography.subtitle, styles.title]}>{title}</Text>
      {message ? <Text style={[typography.caption, styles.message]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <Button title={actionLabel} onPress={onAction} compact />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, styles.errorWrap]}>
        <Icon name="error" size={26} color={colors.danger} />
      </View>
      <Text style={[typography.subtitle, { color: colors.danger }]}>Algo deu errado</Text>
      <Text style={[typography.caption, styles.message]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  errorWrap: {
    backgroundColor: colors.dangerLight,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  title: {
    textAlign: 'center',
  },
  text: {
    marginTop: spacing.sm,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
  actionWrap: {
    marginTop: spacing.md,
  },
});
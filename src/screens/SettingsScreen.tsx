import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, Card, Stepper, Section } from '../components/common';
import { useTrainingSettings } from '../hooks';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';
import { DEFAULT_REST_OPTIONS } from '../models';

export default function SettingsScreen() {
  const { settings, update } = useTrainingSettings();

  const applyRest = (seconds: number) => {
    update({ defaultRestSeconds: seconds });
  };

  const isPreset = DEFAULT_REST_OPTIONS.includes(
    settings.defaultRestSeconds as (typeof DEFAULT_REST_OPTIONS)[number],
  );

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[typography.overline, styles.overline]}>Configurações</Text>
        <Text style={typography.title}>Treino</Text>
        <Text style={[typography.caption, styles.subtitle]}>
          Descanso e preferências de execução
        </Text>
      </View>

      <Section title="Descanso padrão">
        <Card style={styles.restCard} padded={false}>
          <View style={styles.restRow}>
            <View style={styles.restIconWrap}>
              <Icon name="clock" size="sm" color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, styles.restTitle]}>Descanso entre séries</Text>
              <Text style={[typography.caption, styles.restHint]}>
                Usado quando o exercício não define um descanso próprio.
              </Text>
            </View>
          </View>

          <View style={styles.presets}>
            {DEFAULT_REST_OPTIONS.map((secs) => (
              <Pressable
                key={secs}
                onPress={() => applyRest(secs)}
                style={[styles.preset, settings.defaultRestSeconds === secs && styles.presetActive]}
              >
                <Text
                  style={[styles.presetText, settings.defaultRestSeconds === secs && styles.presetTextActive]}
                >
                  {secs}s
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.customRow}>
            <Text style={[typography.bodySecondary, styles.customLabel]}>Personalizado</Text>
            <View style={styles.customRight}>
              {!isPreset ? (
                <Text style={styles.customValue}>{settings.defaultRestSeconds}s</Text>
              ) : null}
              <Stepper
                value={settings.defaultRestSeconds}
                onChange={applyRest}
                min={5}
                max={600}
                accent={colors.text}
                accentLight={colors.border}
              />
            </View>
          </View>
        </Card>
      </Section>

      <Section title="Próximas fases">
        <Card style={styles.soonCard}>
          <View style={styles.soonRow}>
            <Icon name="bell" size={18} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.soonTitle}>Notificações e som</Text>
              <Text style={styles.soonHint}>Som, vibração e fim do descanso em breve.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.soonRow}>
            <Icon name="calendar" size={18} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.soonTitle}>Lembretes de treino</Text>
              <Text style={styles.soonHint}>Baseados na sua rotina semanal, em breve.</Text>
            </View>
          </View>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xxl,
    gap: spacing.xs,
  },
  overline: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  restCard: {
    overflow: 'hidden',
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  restIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTitle: {
    fontWeight: '600',
  },
  restHint: {
    marginTop: 2,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 60,
    alignItems: 'center',
  },
  presetActive: {
    borderColor: colors.primary,
    backgroundColor: colors.scrim,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.primary,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  customLabel: {
    flex: 1,
  },
  customRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  customValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  soonCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
  },
  soonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  soonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  soonHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
});
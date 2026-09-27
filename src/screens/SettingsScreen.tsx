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

      <Section title="Horário habitual de treino">
        <Card style={styles.timeCard} padded={false}>
          <View style={styles.restRow}>
            <View style={styles.restIconWrap}>
              <Icon name="calendar" size="sm" color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, styles.restTitle]}>Seu horário de treino</Text>
              <Text style={[typography.caption, styles.restHint]}>
                Usado como referência para os lembretes inteligentes da sua rotina.
              </Text>
            </View>
          </View>

          <View style={styles.presets}>
            {['06:00', '07:00', '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((time) => {
              const active = settings.habitualTrainingTime === time;
              return (
                <Pressable
                  key={time}
                  onPress={() => update({ habitualTrainingTime: time })}
                  style={[styles.preset, active && styles.presetActive]}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{time}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </Section>

      <Section title="Lembretes progressivos (Fase 8)">
        <Card style={styles.notificationCard} padded={false}>
          {/* Global switch */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Notificações do DALLAS</Text>
              <Text style={styles.toggleHint}>Ativar lembretes inteligentes de treino</Text>
            </View>
            <Pressable
              style={[styles.switchTrack, settings.notificationsEnabled && styles.switchTrackActive]}
              onPress={() => update({ notificationsEnabled: !settings.notificationsEnabled })}
            >
              <View
                style={[styles.switchThumb, settings.notificationsEnabled && styles.switchThumbActive]}
              />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* T-2h */}
          <View style={styles.stageRow}>
            <View style={styles.stageHeader}>
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>T-2h</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>Preparatório</Text>
                <Text style={styles.stageDesc}>Hidrate-se e prepare sua refeição pré-treino.</Text>
              </View>
              <Pressable
                style={[
                  styles.miniSwitch,
                  settings.notifyTMinus2h && settings.notificationsEnabled && styles.miniSwitchActive,
                ]}
                onPress={() => update({ notifyTMinus2h: !settings.notifyTMinus2h })}
              >
                <View
                  style={[
                    styles.miniSwitchThumb,
                    settings.notifyTMinus2h && settings.notificationsEnabled && styles.miniSwitchThumbActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* T-15m */}
          <View style={styles.stageRow}>
            <View style={styles.stageHeader}>
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>T-15m</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>Chamada curta</Text>
                <Text style={styles.stageDesc}>"Hora de ir. A barra tá te esperando!"</Text>
              </View>
              <Pressable
                style={[
                  styles.miniSwitch,
                  settings.notifyTMinus15m && settings.notificationsEnabled && styles.miniSwitchActive,
                ]}
                onPress={() => update({ notifyTMinus15m: !settings.notifyTMinus15m })}
              >
                <View
                  style={[
                    styles.miniSwitchThumb,
                    settings.notifyTMinus15m && settings.notificationsEnabled && styles.miniSwitchThumbActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* T+30m */}
          <View style={styles.stageRow}>
            <View style={styles.stageHeader}>
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>T+30m</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>Dallas tá de olho</Text>
                <Text style={styles.stageDesc}>Cobrança com humor se ainda não iniciou.</Text>
              </View>
              <Pressable
                style={[
                  styles.miniSwitch,
                  settings.notifyTPlus30m && settings.notificationsEnabled && styles.miniSwitchActive,
                ]}
                onPress={() => update({ notifyTPlus30m: !settings.notifyTPlus30m })}
              >
                <View
                  style={[
                    styles.miniSwitchThumb,
                    settings.notifyTPlus30m && settings.notificationsEnabled && styles.miniSwitchThumbActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Fim do dia */}
          <View style={styles.stageRow}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageBadge, { backgroundColor: '#3A1416' }]}>
                <Text style={[styles.stageBadgeText, { color: '#FF4D4D' }]}>21:00</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>Streak em risco</Text>
                <Text style={styles.stageDesc}>
                  Aviso final apenas em dias programados sem treino registrado.
                </Text>
              </View>
              <Pressable
                style={[
                  styles.miniSwitch,
                  settings.notifyEndOfDayStreakRisk && settings.notificationsEnabled && styles.miniSwitchActive,
                ]}
                onPress={() => update({ notifyEndOfDayStreakRisk: !settings.notifyEndOfDayStreakRisk })}
              >
                <View
                  style={[
                    styles.miniSwitchThumb,
                    settings.notifyEndOfDayStreakRisk && settings.notificationsEnabled && styles.miniSwitchThumbActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>
        </Card>
      </Section>

      <Section title="Sons e vibração">
        <Card style={styles.notificationCard} padded={false}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Sons de descanso e timer</Text>
              <Text style={styles.toggleHint}>Bip de 3s finais e aviso ao zerar</Text>
            </View>
            <Pressable
              style={[styles.switchTrack, settings.soundEnabled && styles.switchTrackActive]}
              onPress={() => update({ soundEnabled: !settings.soundEnabled })}
            >
              <View style={[styles.switchThumb, settings.soundEnabled && styles.switchThumbActive]} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Vibração tátil</Text>
              <Text style={styles.toggleHint}>Feedback háptico nas contagens e metas</Text>
            </View>
            <Pressable
              style={[styles.switchTrack, settings.vibrationEnabled && styles.switchTrackActive]}
              onPress={() => update({ vibrationEnabled: !settings.vibrationEnabled })}
            >
              <View
                style={[styles.switchThumb, settings.vibrationEnabled && styles.switchThumbActive]}
              />
            </Pressable>
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
  timeCard: {
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
  notificationCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  toggleHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stageRow: {
    paddingVertical: spacing.md,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stageBadge: {
    backgroundColor: 'rgba(255, 30, 39, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stageBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  stageDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  miniSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.borderLight,
    padding: 2,
    justifyContent: 'center',
  },
  miniSwitchActive: {
    backgroundColor: colors.primary,
  },
  miniSwitchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text,
  },
  miniSwitchThumbActive: {
    transform: [{ translateX: 18 }],
  },
});
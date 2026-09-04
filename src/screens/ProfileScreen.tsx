import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, Card, Section, IconButton } from '../components/common';
import { useUser, useWorkoutLogs } from '../hooks';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import { AppIconName } from '../theme/icons';
import { workoutLogService } from '../services';

// Direção visual do alto-falante/halter do DALLAS.
// Nesta etapa apenas apresentamos o conceito, sem o sistema completo do pet.
function PetMark() {
  return (
    <View style={styles.petRing}>
      <View style={styles.petIcon}>
        <Icon name="dumbbell" size={28} color={colors.primary} />
      </View>
      <View style={styles.petLevel}>
        <Text style={styles.petLevelText}>LV</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { logout } = useAuth();
  const { logs } = useWorkoutLogs();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    workoutLogService.getStreak().then(setStreak).catch(() => {});
  }, [logs.length]);

  const firstName = user?.name.split(' ')[0] ?? 'Atleta';

  const stats = useMemo(() => {
    const volume = logs.reduce((acc, l) => acc + l.totalVolume, 0);
    return {
      workouts: logs.length,
      volume,
      last: logs[0] ? new Date(logs[0].startedAt).toLocaleDateString('pt-BR') : '—',
    };
  }, [logs]);

  return (
    <Screen scroll>
      <View style={styles.identity}>
        <PetMark />
        <View style={styles.identityText}>
          <Text style={[typography.overline, styles.nameLabel]}>Atleta</Text>
          <Text style={styles.name}>{firstName}</Text>
          <Text style={styles.tagline}>Consistência constrói força.</Text>
        </View>
        <IconButton name="settings" onPress={() => {}} color={colors.text} />
      </View>

      <Section title="Seus números">
        <View style={styles.statRow}>
          <StatCard label="Treinos" value={`${stats.workouts}`} icon="checkmarkDone" />
          <StatCard label="Volume" value={fmtVol(stats.volume)} icon="flame" />
          <StatCard label="Último" value={stats.last.slice(0, 5)} icon="calendar" />
        </View>
      </Section>

      <Section title="Conquistas">
        <Card style={styles.achievementCard}>
          <View style={styles.achievementRow}>
            <Achievement
              icon="streak"
              label="SEQUÊNCIA"
              value={streak > 0 ? `${streak} dia(s) seguido(s)` : 'Dê início à sua sequência'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.achievementRow}>
            <Achievement icon="medal" label="MARCAS" value="Bata seu primeiro PR" locked />
          </View>
          <View style={styles.divider} />
          <View style={styles.achievementRow}>
            <Achievement icon="cup" label="PRIMEIRO TREINO" value={`${stats.workouts} realizado(s)`} />
          </View>
        </Card>
      </Section>

      <Section title="Configurações">
        <Card style={styles.settingsList}>
          <SettingsRow icon="person" label="Perfil" hint="Seu nome e dados" />
          <View style={styles.divider} />
          <SettingsRow icon="dumbbell" label="Halter" hint="Seu companheiro de treino" />
          <View style={styles.divider} />
          <SettingsRow icon="bell" label="Notificações" hint="Lembretes de treino" />
          <View style={styles.divider} />
          <SettingsRow icon="info" label="Sobre o DALLAS" hint="Versão 1.0" />
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
            onPress={() => logout()}
          >
            <Icon name="lock" size={18} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, styles.logoutLabel]}>Sair da conta</Text>
              <Text style={styles.settingsHint}>Encerrar sessão neste dispositivo</Text>
            </View>
            <Icon name="chevronRight" size="sm" color={colors.textMuted} />
          </Pressable>
        </Card>
      </Section>
    </Screen>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: AppIconName }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Achievement({
  icon,
  label,
  value,
  locked = false,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  locked?: boolean;
}) {
  return (
    <View style={styles.achievementRow}>
      <View style={[styles.achIcon, locked && styles.achLocked]}>
        <Icon name={icon} size={18} color={locked ? colors.textMuted : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.achLabel}>{label}</Text>
        <Text style={styles.achValue}>{value}</Text>
      </View>
      {locked ? <Icon name="lock" size="xs" color={colors.textMuted} /> : null}
    </View>
  );
}

function SettingsRow({ icon, label, hint }: { icon: AppIconName; label: string; hint: string }) {
  return (
    <View style={styles.settingsRow}>
      <Icon name={icon} size={18} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { fontSize: 14 }]}>{label}</Text>
        <Text style={styles.settingsHint}>{hint}</Text>
      </View>
      <Icon name="chevronRight" size="sm" color={colors.textMuted} />
    </View>
  );
}

function fmtVol(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return `${v}`;
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.lg,
  },
  petRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  petIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.scrimSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petLevel: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petLevelText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  nameLabel: {
    marginBottom: 0,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  achievementCard: {
    padding: 0,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  achIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achLocked: {
    backgroundColor: colors.surface,
  },
  achLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  achValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  settingsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  settingsHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutLabel: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
});
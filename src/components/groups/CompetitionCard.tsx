import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import { Button } from '../common';
import { formatDate } from '../../services';
import type { Competition } from '../../models';

const STATUS_COLOR: Record<Competition['status'], string> = {
  PENDING: '#f5a623',
  ACTIVE: colors.primary,
  FINISHED: colors.textSecondary,
};

const STATUS_LABEL: Record<Competition['status'], string> = {
  PENDING: 'EM BREVE',
  ACTIVE: 'AO VIVO',
  FINISHED: 'ENCERRADA',
};

export default function CompetitionCard({
  competition,
  onPress,
  onJoin,
  onFinish,
  canFinish,
  joining,
}: {
  competition: Competition;
  onPress: () => void;
  onJoin?: () => void;
  onFinish?: () => void;
  canFinish?: boolean;
  joining?: boolean;
}) {
  const finished = competition.status === 'FINISHED';
  const joined = competition.joined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text style={[typography.subtitle, styles.name]} numberOfLines={1}>
          {competition.name}
        </Text>
        <View style={[styles.badge, { borderColor: STATUS_COLOR[competition.status] }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[competition.status] }]}>
            {STATUS_LABEL[competition.status]}
          </Text>
        </View>
      </View>

      {competition.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {competition.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Icon name="calendar-outline" size="sm" color={colors.textMuted} />
        <Text style={styles.meta}>{formatDate(competition.startsAt)} → {formatDate(competition.endsAt)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Icon name="people-outline" size="sm" color={colors.textMuted} />
        <Text style={styles.meta}>
          {competition.participantCount} {competition.participantCount === 1 ? 'participante' : 'participantes'}
        </Text>
      </View>

      <View style={styles.actions}>
        {!finished && !joined && onJoin ? (
          <Button title="Participar" variant="secondary" compact fullWidth={false} onPress={onJoin} loading={joining} />
        ) : null}
        {!finished && canFinish && onFinish ? (
          <Button title="Encerrar" variant="ghost" compact fullWidth={false} onPress={onFinish} />
        ) : null}
        {finished ? (
          <Text style={styles.finishedLabel}>Ranking final disponível</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  desc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  finishedLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
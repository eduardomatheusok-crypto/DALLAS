import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import type { RankingEntry } from '../../models';
import ScoreBreakdownModal from './ScoreBreakdownModal';
import { LoadingState } from '../common';

function medalFor(position: number): string | null {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return null;
}

export default function RankingList({
  ranking,
  myUserId,
  loading,
}: {
  ranking: RankingEntry[];
  myUserId?: string;
  loading?: boolean;
}) {
  const [selected, setSelected] = useState<RankingEntry | null>(null);

  if (loading) {
    return <LoadingState label="Calculando ranking..." />;
  }
  if (ranking.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.list}>
        {ranking.map((entry) => {
          const isMe = entry.user.id === myUserId;
          const medal = medalFor(entry.position);
          return (
            <Pressable
              key={entry.user.id}
              onPress={() => setSelected(entry)}
              style={({ pressed }) => [
                styles.row,
                isMe && styles.rowMe,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.positionWrap}>
                {medal ? (
                  <Text style={styles.medal}>{medal}</Text>
                ) : (
                  <Text style={[styles.position, entry.position <= 5 && styles.highlight]}>
                    {entry.position}
                  </Text>
                )}
              </View>
              <View style={styles.info}>
                <Text style={[typography.body, styles.name]} numberOfLines={1}>
                  {entry.user.name}
                </Text>
                <Text style={styles.sub}>
                  +{entry.stats.progressPct}% · {entry.stats.trainedDays}d
                </Text>
              </View>
              {isMe ? <Text style={styles.you}>você</Text> : null}
              <Text style={[typography.subtitle, styles.total]}>
                {Math.round(entry.totalScore).toLocaleString('pt-BR')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ScoreBreakdownModal visible={!!selected} entry={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  rowMe: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.85,
  },
  positionWrap: {
    width: 34,
    alignItems: 'center',
  },
  medal: {
    fontSize: 20,
  },
  position: {
    ...typography.subtitle,
    color: colors.textMuted,
  },
  highlight: {
    color: colors.text,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  sub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  you: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  total: {
    color: colors.white,
  },
});
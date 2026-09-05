import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { ProgressBar } from '../common';
import type { RankingEntry } from '../../models';

const SLICES = [
  { key: 'progressionScore', label: 'Progressão', max: 400, color: colors.primary },
  { key: 'consistencyScore', label: 'Consistência', max: 300, color: '#f5a623' },
  { key: 'volumeScore', label: 'Volume', max: 200, color: '#34c759' },
  { key: 'goalsScore', label: 'Metas', max: 100, color: '#0a84ff' },
] as const;

function fmt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}

export default function ScoreBreakdownModal({
  visible,
  entry,
  onClose,
}: {
  visible: boolean;
  entry: RankingEntry | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {entry ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={[typography.overline, styles.position]}>#{entry.position}</Text>
                  <Text style={[typography.subtitle, styles.name]}>{entry.user.name}</Text>
                </View>
                <View style={styles.totalWrap}>
                  <Text style={[typography.heroTitle, styles.total]}>{fmt(entry.totalScore)}</Text>
                  <Text style={[typography.overline, styles.totalLabel]}>PTS</Text>
                </View>
              </View>

              <View style={styles.bars}>
                {SLICES.map((s) => {
                  const value = entry[s.key];
                  const fraction = value / s.max;
                  return (
                    <View key={s.key} style={styles.barRow}>
                      <View style={styles.barLabel}>
                        <Text style={styles.barLabelText}>{s.label}</Text>
                        <Text style={styles.barValue}>{fmt(value)}</Text>
                      </View>
                      <ProgressBar progress={fraction} color={s.color} />
                    </View>
                  );
                })}
              </View>

              <View style={styles.stats}>
                <Stat label="Evolução" value={`+${entry.stats.progressPct}%`} />
                <Stat label="Dias" value={`${entry.stats.trainedDays}`} />
                <Stat label="Volume" value={fmt(entry.stats.totalVolume)} />
                <Stat label="PRs" value={`${entry.stats.prCount}`} />
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  position: {
    color: colors.primary,
  },
  name: {
    textTransform: 'none',
  },
  totalWrap: {
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 32,
    lineHeight: 34,
  },
  totalLabel: {
    fontSize: 10,
  },
  bars: {
    gap: spacing.md,
  },
  barRow: {
    gap: 6,
  },
  barLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabelText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  barValue: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
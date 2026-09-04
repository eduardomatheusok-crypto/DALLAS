import React, { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { EmptyState, LoadingState } from '../components/common';
import Screen from '../components/common/Screen';
import { useWorkoutLogs } from '../hooks';
import { formatDate, formatTime, formatDuration } from '../services';
import { colors, spacing, borderRadius, typography, SET_CATEGORY_THEME } from '../theme';
import { Icon } from '../theme/icons';
import { SET_TYPE_LABEL, SET_CATEGORY_PREFIX, type SetType, type SetCategory } from '../models';

type RouteProps = {
  key: string;
  name: string;
  params: { logId: string };
};

export default function LogDetailScreen() {
  const route = useRoute<RouteProps>();
  const { logId } = route.params;
  const { logs, loading } = useWorkoutLogs();

  const log = useMemo(() => logs.find((l) => l.id === logId), [logs, logId]);

  if (loading) return <Screen><LoadingState /></Screen>;
  if (!log) {
    return (
      <Screen>
        <EmptyState title="Treino não encontrado" />
      </Screen>
    );
  }

  const sections = log.exercises.map((e) => ({
    title: e.exerciseName,
    notes: e.notes,
    data: e.sets,
  }));

  return (
    <Screen scroll={false}>
      <Text style={typography.title}>{log.workoutName}</Text>
      <Text style={[typography.caption, styles.subtitle]}>
        {formatDate(log.startedAt)} · {formatTime(log.startedAt)}
      </Text>

      <View style={styles.summaryRow}>
        <SummaryItem label="Duração" value={formatDuration(log.durationSeconds)} />
        <SummaryItem label="Exercícios" value={`${log.exercises.length}`} />
        <SummaryItem label="Volume" value={formatVolume(log.totalVolume)} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrap}>
            <Text style={[typography.subtitle, styles.sectionHeader]}>
              {section.title}
            </Text>
            {section.notes ? (
              <Text style={[typography.small, styles.notesText]}>{section.notes}</Text>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => {
          const cat = (item.category ?? 'working') as SetCategory;
          const theme = SET_CATEGORY_THEME[cat];
          return (
            <View style={styles.setRow}>
              <Text style={[typography.body, styles.setNum, { color: theme.accent }]}>
                {SET_CATEGORY_PREFIX[cat]}{item.setNumber}
              </Text>
              <Text style={[typography.body, styles.setDetail]}>
                {item.weight} kg × {item.reps}
              </Text>
              {item.type && item.type !== 'normal' ? (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{SET_TYPE_LABEL[item.type as SetType] ?? '—'}</Text>
                </View>
              ) : null}
              <View style={[styles.catDot, { backgroundColor: theme.dot }]} />
              <View style={item.completed ? styles.doneIcon : styles.pendingIcon}>
                {item.completed ? (
                  <Icon name="check" size="xs" color={colors.success} />
                ) : (
                  <Text style={styles.pendingText}>—</Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="empty" title="Sem séries registradas" />
        }
      />
    </Screen>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[typography.subtitle, { color: colors.primary }]}>{value}</Text>
      <Text style={typography.small}>{label}</Text>
    </View>
  );
}

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return `${volume}`;
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  list: {
    paddingBottom: spacing.xxxl,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionHeaderWrap: {
    marginTop: spacing.lg,
  },
  notesText: {
    marginBottom: spacing.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  typeBadge: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  typeBadgeText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  setNum: {
    width: 48,
    color: colors.textSecondary,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  setDetail: {
    flex: 1,
  },
  done: {
    color: colors.success,
  },
  pending: {
    color: colors.textMuted,
  },
  doneIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Card, EmptyState, LoadingState } from '../../components/common';
import { useWorkoutLogs } from '../../hooks';
import { formatDate, formatDuration } from '../../services';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HistoryTab() {
  const navigation = useNavigation<Nav>();
  const { logs, loading } = useWorkoutLogs();

  if (loading) return <LoadingState />;

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      style={styles.listScroll}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <EmptyState
          icon="calendar"
          title="Nenhum treino realizado"
          message="Quando você finalizar um treino, ele aparecerá aqui."
        />
      }
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => navigation.navigate('LogDetail', { logId: item.id })}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Card style={[styles.card, index === 0 && styles.latestCard]}>
            <View style={styles.topRow}>
              <View style={styles.nameWrap}>
                {index === 0 ? (
                  <Text style={[typography.overline, styles.latestTag]}>Mais recente</Text>
                ) : null}
                <Text style={[typography.body, styles.name]} numberOfLines={1}>
                  {item.workoutName}
                </Text>
              </View>
              <View style={styles.volumeBadge}>
                <Icon name="flame" size="xs" color={colors.primary} />
                <Text style={styles.volumeText}>{formatVolume(item.totalVolume)} kg</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Icon name="calendar" size="xs" color={colors.textSecondary} />
              <Text style={styles.meta}>{formatDate(item.startedAt)}</Text>
              <Text style={styles.dot}>·</Text>
              <Icon name="clock" size="xs" color={colors.textSecondary} />
              <Text style={styles.meta}>{formatDuration(item.durationSeconds)}</Text>
              <Text style={styles.dot}>·</Text>
              <Icon name="repeat" size="xs" color={colors.textSecondary} />
              <Text style={styles.meta}>{item.exercises.length} exercícios</Text>
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return `${volume}`;
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  listScroll: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    padding: spacing.lg,
  },
  latestCard: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  latestTag: {
    color: colors.primary,
    marginBottom: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    flexShrink: 1,
  },
  volumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.scrim,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md,
  },
  volumeText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  meta: {
    ...typography.small,
    color: colors.textSecondary,
  },
  dot: {
    color: colors.textMuted,
  },
});

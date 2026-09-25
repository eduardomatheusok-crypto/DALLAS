import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { EmptyState, LoadingState } from '../../components/common';
import { useWorkoutLogs } from '../../hooks';
import { formatDate, formatDuration } from '../../services';
import { colors, spacing, borderRadius } from '../../theme';
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
      ListHeaderComponent={
        logs.length > 0 ? (
          <Text style={styles.headerTitle}>Treinos realizados</Text>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="calendar"
          title="Nenhum treino realizado"
          message="Quando você finalizar um treino, ele aparecerá aqui com seu histórico completo."
        />
      }
      renderItem={({ item }) => {
        const totalSets = item.exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.completed).length, 0);
        const durationMin = Math.round(item.durationSeconds / 60);
        const volumeStr = item.totalVolume >= 1000 ? `${(item.totalVolume / 1000).toFixed(1)}k kg` : `${item.totalVolume} kg`;

        return (
          <Pressable
            onPress={() => navigation.navigate('LogDetail', { logId: item.id })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            {/* Green Checkmark Badge */}
            <View style={styles.checkBadge}>
              <Icon name="check" size={14} color="#34C759" />
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.workoutName}
              </Text>
              <Text style={styles.meta}>
                {totalSets > 0 ? `${totalSets} set • ` : ''}
                {durationMin > 0 ? `${durationMin} min • ` : ''}
                {volumeStr}
              </Text>
            </View>

            {/* Chevron */}
            <Icon name="chevronRight" size="sm" color="#666666" />
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listScroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
    gap: spacing.md,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  meta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

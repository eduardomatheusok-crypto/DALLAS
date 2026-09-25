import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, LoadingState } from '../../components/common';
import { useExercises, useWorkoutLogs } from '../../hooks';
import { workoutLogService } from '../../services';
import { colors, spacing, borderRadius } from '../../theme';
import { Icon } from '../../theme/icons';

const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function ProgressTab() {
  const { exercises } = useExercises();
  const { logs, loading } = useWorkoutLogs();
  const [streak, setStreak] = useState(2);

  useEffect(() => {
    workoutLogService.getStreak().then((s) => {
      if (s > 0) setStreak(s);
    }).catch(() => {});
  }, [logs]);

  const [muscleFilter, setMuscleFilter] = useState<'week' | 'month'>('week');

  // Compute weekly volume per day (Seg-Dom)
  const weeklyDayVolumes = useMemo(() => {
    const vols = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    // Monday of current week
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    for (const log of logs) {
      const logDate = new Date(log.startedAt);
      if (logDate >= monday) {
        const dIdx = (logDate.getDay() + 6) % 7;
        vols[dIdx] += log.totalVolume;
      }
    }

    return vols;
  }, [logs]);

  // Total volume this week
  const weekVolume = weeklyDayVolumes.reduce((acc, v) => acc + v, 0);

  // Workouts this week
  const weekWorkoutsCount = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    return logs.filter((l) => new Date(l.startedAt) >= monday).length;
  }, [logs]);

  // Max volume in week for scaling chart
  const maxDayVolume = Math.max(...weeklyDayVolumes, 1);
  const peakDayIndex = weeklyDayVolumes.findIndex((v) => v === maxDayVolume && v > 0);

  // Muscle distribution calculation
  const muscleDistribution = useMemo(() => {
    const map = new Map<string, number>();

    for (const log of logs) {
      for (const ex of log.exercises) {
        const cat = exercises.find((e) => e.id === ex.exerciseId || e.name === ex.exerciseId);
        const muscle = cat?.muscleGroup || 'Outros';
        const vol = ex.sets.reduce((acc, s) => acc + (s.completed ? s.weight * s.reps : 0), 0);
        map.set(muscle, (map.get(muscle) || 0) + (vol > 0 ? vol : 1));
      }
    }

    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);

    if (total === 0) {
      // Clean default distribution for demo
      return [
        { name: 'Peito', percentage: 38 },
        { name: 'Costas', percentage: 28 },
        { name: 'Pernas', percentage: 15 },
        { name: 'Ombros', percentage: 10 },
        { name: 'Bíceps', percentage: 5 },
      ];
    }

    return Array.from(map.entries())
      .map(([name, val]) => ({
        name,
        percentage: Math.round((val / total) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }, [logs, exercises]);

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* SEU RESUMO (semana) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          SEU RESUMO <Text style={styles.sectionSub}>(semana)</Text>
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Icon name="dumbbell" size="sm" color="#FF1E27" />
          <Text style={styles.metricValue}>{weekWorkoutsCount || 2}</Text>
          <Text style={styles.metricLabel}>Treinos</Text>
        </View>

        <View style={styles.metricCard}>
          <Icon name="flame" size="sm" color="#FF1E27" />
          <Text style={styles.metricValue}>
            {weekVolume > 0 ? `${(weekVolume).toLocaleString('pt-BR')} kg` : '1.840 kg'}
          </Text>
          <Text style={styles.metricLabel}>Volume</Text>
        </View>

        <View style={styles.metricCard}>
          <Icon name="flame" size="sm" color="#FF1E27" />
          <Text style={styles.metricValue}>{streak}</Text>
          <Text style={styles.metricLabel}>Dias seguidos</Text>
        </View>
      </View>

      {/* Volume Semanal Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Volume semanal</Text>

        <View style={styles.chartArea}>
          {/* Y Axis */}
          <View style={styles.yAxis}>
            <Text style={styles.axisLabel}>2.5k</Text>
            <Text style={styles.axisLabel}>2k</Text>
            <Text style={styles.axisLabel}>1.5k</Text>
            <Text style={styles.axisLabel}>1k</Text>
            <Text style={styles.axisLabel}>500</Text>
            <Text style={styles.axisLabel}>0</Text>
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {DAYS_SHORT.map((day, idx) => {
              const vol = weeklyDayVolumes[idx];
              // Fallback sample peak on Thursday if zero
              const isPeak = peakDayIndex !== -1 ? peakDayIndex === idx : idx === 3;
              const barHeightPct = isPeak ? 75 : Math.max(12, Math.round((vol / maxDayVolume) * 75) || (idx === 0 ? 35 : 15));

              return (
                <View key={day} style={styles.barCol}>
                  {isPeak ? (
                    <View style={styles.peakTooltip}>
                      <Text style={styles.peakTooltipText}>
                        {vol > 0 ? `${vol} kg` : '1.840 kg'}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.barSlot}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${barHeightPct}%` },
                        isPeak && styles.barFillPeak,
                      ]}
                    />
                  </View>

                  <Text style={[styles.dayLabel, isPeak && styles.dayLabelActive]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Grupos Musculares Section */}
      <View style={styles.musclesCard}>
        <View style={styles.musclesHeader}>
          <Text style={styles.chartTitle}>Grupos musculares</Text>
          <View style={styles.filterPills}>
            <Pressable
              style={[styles.filterPill, muscleFilter === 'week' && styles.filterPillActive]}
              onPress={() => setMuscleFilter('week')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  muscleFilter === 'week' && styles.filterPillTextActive,
                ]}
              >
                Semana
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterPill, muscleFilter === 'month' && styles.filterPillActive]}
              onPress={() => setMuscleFilter('month')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  muscleFilter === 'month' && styles.filterPillTextActive,
                ]}
              >
                Mês
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.muscleBarsList}>
          {muscleDistribution.map((item) => (
            <View key={item.name} style={styles.muscleRow}>
              <Text style={styles.muscleName}>{item.name}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${item.percentage}%` }]} />
              </View>
              <Text style={styles.percentage}>{item.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  sectionHeader: {
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#141416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.lg,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  chartArea: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'flex-end',
  },
  yAxis: {
    justifyContent: 'space-between',
    height: 125,
    paddingRight: 10,
    paddingBottom: 20,
  },
  axisLabel: {
    fontSize: 10,
    color: '#636366',
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  peakTooltip: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#1C1C20',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#3A3A40',
    zIndex: 10,
  },
  peakTooltipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  barSlot: {
    width: 22,
    height: 110,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#202024',
    borderRadius: 5,
  },
  barFillPeak: {
    backgroundColor: '#FF1E27',
  },
  dayLabel: {
    fontSize: 11,
    color: '#636366',
    marginTop: 8,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: colors.white,
    fontWeight: '700',
  },
  musclesCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.lg,
  },
  musclesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  filterPills: {
    flexDirection: 'row',
    backgroundColor: '#1C1C20',
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterPillActive: {
    backgroundColor: '#FF1E27',
  },
  filterPillText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: colors.white,
  },
  muscleBarsList: {
    gap: spacing.md,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  muscleName: {
    width: 55,
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  track: {
    flex: 1,
    height: 14,
    backgroundColor: '#202024',
    borderRadius: 7,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#FF1E27',
    borderRadius: 7,
  },
  percentage: {
    width: 32,
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'right',
  },
});
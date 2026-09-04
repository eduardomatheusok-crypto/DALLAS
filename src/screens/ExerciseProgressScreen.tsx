import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  LineChart,
} from 'react-native-chart-kit';
import { Card, CardHeader, LoadingState, EmptyState } from '../components/common';
import Screen from '../components/common/Screen';
import { workoutLogService } from '../services';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon, type IconName, type AppIconName } from '../theme/icons';

type RouteProps = {
  key: string;
  name: string;
  params: { exerciseId: string; name: string };
};

interface HistoryPoint {
  date: string;
  maxWeight: number;
  maxReps: number;
  volume: number;
}

export default function ExerciseProgressScreen() {
  const route = useRoute<RouteProps>();
  const { exerciseId, name } = route.params;
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await workoutLogService.getHistoryByExercise(exerciseId);
      setHistory(result);
      setLoading(false);
    })();
  }, [exerciseId]);

  if (loading) return <Screen><LoadingState /></Screen>;

  const width = Dimensions.get('window').width - spacing.lg * 2;

  if (history.length === 0) {
    return (
      <Screen>
        <Text style={typography.title}>{name}</Text>
        <EmptyState title="Sem dados" message="Complete este exercício para ver a evolução." />
      </Screen>
    );
  }

  const bestWeight = Math.max(...history.map((h) => h.maxWeight));
  const bestReps = Math.max(...history.map((h) => h.maxReps));
  const totalVolume = history.reduce((acc, h) => acc + h.volume, 0);
  const last = history[history.length - 1];

  const labels = history.map((h) =>
    new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  );
  const weightData = history.map((h) => h.maxWeight);

  return (
    <Screen scroll>
      <Text style={[typography.title, styles.title]}>{name}</Text>

      <View style={styles.statGrid}>
        <StatBox icon="weight" label="Maior peso" value={`${bestWeight} kg`} />
        <StatBox icon="repeat" label="Máx reps" value={`${bestReps}`} />
        <StatBox icon="flame" label="Volume total" value={`${formatVol(totalVolume)} kg`} />
        <StatBox icon="trending-up" label="Último" value={`${last.maxWeight} × ${last.maxReps}`} />
      </View>

      <Card>
        <CardHeader title="Maior peso ao longo do tempo" />
        {weightData.length >= 2 ? (
          <>
            <LineChart
              data={{
                labels,
                datasets: [{ data: weightData }],
              }}
              width={width}
              height={200}
              yAxisSuffix="kg"
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(229, 9, 20, ${opacity})`,
                labelColor: () => colors.textSecondary,
                style: { borderRadius: borderRadius.md },
                propsForDots: { r: '5', strokeWidth: '2', stroke: colors.primaryLight },
              }}
              bezier
              style={{ borderRadius: borderRadius.md }}
            />
            <Text style={[typography.small, styles.chartHint]}>
              {history.length} registro(s). Toque nos pontos para detalhes.
            </Text>
          </>
        ) : (
          <Text style={typography.caption}>
            Complete este exercício mais de uma vez para ver o gráfico.
          </Text>
        )}
      </Card>
    </Screen>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: IconName | AppIconName }) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statIconWrap}>
        <Icon name={icon} size="sm" color={colors.primaryLight} />
      </View>
      <Text style={[typography.subtitle, { color: colors.primary }]}>{value}</Text>
      <Text style={typography.small}>{label}</Text>
    </View>
  );
}

function formatVol(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return `${volume}`;
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    width: '47%',
    gap: spacing.xs,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  chartHint: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

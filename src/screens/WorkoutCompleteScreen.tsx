import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button, Card } from '../components/common';
import Screen from '../components/common/Screen';
import { formatDuration } from '../services';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = {
  key: string;
  name: string;
  params: { durationSeconds: number; volume: number; series: number };
};

export default function WorkoutCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { durationSeconds, volume, series } = route.params;
  const insets = useSafeAreaInsets();

  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.spring(badgeScale, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
    Animated.timing(badgeOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.badge, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}
        >
          <Icon name="checkmarkDone" size="xl" color={colors.primary} />
        </Animated.View>

        <Animated.View style={[styles.heading, { opacity: contentOpacity }]}>
          <Text style={[typography.title, styles.title]}>Treino concluído!</Text>
          <Text style={[typography.bodySecondary, styles.message]}>Excelente trabalho! 🔥</Text>
        </Animated.View>

        <Animated.View style={[styles.summary, { opacity: contentOpacity }]}>
          <Card style={styles.summaryCard}>
            <View style={styles.metricsRow}>
              <Metric label="Volume" value={`${formatVolume(volume)} kg`} />
              <Metric label="Duração" value={formatDuration(durationSeconds)} />
              <Metric label="Séries" value={`${series}`} />
            </View>
          </Card>
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        <Button title="Continuar" onPress={goHome} />
      </View>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={typography.statLabel}>{label}</Text>
      <Text style={[typography.statValue, styles.metricValue]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function formatVolume(volume: number): string {
  return Math.round(volume).toLocaleString('pt-BR');
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    ...shadows.glow,
  },
  heading: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  summary: {
    alignSelf: 'stretch',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
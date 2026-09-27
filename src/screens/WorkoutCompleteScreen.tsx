import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Screen from '../components/common/Screen';
import {
  formatDuration,
  workoutLogService,
  trainingPreferencesService,
  achievementService,
  communityService,
  type Achievement,
} from '../services';
import type { WorkoutLog } from '../models';
import { colors, spacing } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';
import AchievementModal from '../components/common/AchievementModal';
import type { UserTrainingPreferences, WeekDay } from '../models/UserTrainingPreferences';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = {
  key: string;
  name: string;
  params: {
    durationSeconds: number;
    volume: number;
    series: number;
    workoutId?: string;
    hasPR?: boolean;
  };
};

const WEEKDAY_KEYS: { key: WeekDay; short: string }[] = [
  { key: 'monday', short: 'SEG' },
  { key: 'tuesday', short: 'TER' },
  { key: 'wednesday', short: 'QUA' },
  { key: 'thursday', short: 'QUI' },
  { key: 'friday', short: 'SEX' },
  { key: 'saturday', short: 'SÁB' },
  { key: 'sunday', short: 'DOM' },
];

export default function WorkoutCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { durationSeconds, volume, series, hasPR } = route.params;
  const insets = useSafeAreaInsets();

  // Etapas do fluxo: 'consistency' (1) -> 'summary' (2) -> AchievementModal (3)
  const [stage, setStage] = useState<'consistency' | 'summary'>('consistency');
  const [streak, setStreak] = useState(1);
  const [userPrefs, setUserPrefs] = useState<UserTrainingPreferences | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [currentModalAchievement, setCurrentModalAchievement] = useState<Achievement | null>(null);
  const [shared, setShared] = useState(false);

  // Animações Etapa 1: Chama e Streak
  const flameScale = useRef(new Animated.Value(0.4)).current;
  const flameOpacity = useRef(new Animated.Value(0)).current;
  const streakTextScale = useRef(new Animated.Value(0.6)).current;

  // Animações Etapa 2: Resumo
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  const summaryTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // 1. Dispara feedback tátil de sucesso e ativa animação da chama
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.spring(flameScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(flameOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      Animated.spring(streakTextScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }).start();
    });

    // 2. Carrega logs, calcula streak real e avalia conquistas
    (async () => {
      try {
        const [currentStreak, allLogs, prefs] = await Promise.all([
          workoutLogService.getStreak(),
          workoutLogService.getAll(),
          trainingPreferencesService.getFor('local-user'),
        ]);

        setStreak(Math.max(1, currentStreak));
        setRecentLogs(allLogs);
        setUserPrefs(prefs);

        // Avalia conquistas
        if (allLogs.length > 0) {
          const lastLog = allLogs[allLogs.length - 1];
          const newUnlocked = await achievementService.evaluateOnWorkoutComplete({
            allLogs,
            currentLog: lastLog,
            userPrefs: prefs,
            currentStreak: Math.max(1, currentStreak),
            hasPR: !!hasPR,
          });

          if (newUnlocked.length > 0) {
            setUnlockedAchievements(newUnlocked);
            setCurrentModalAchievement(newUnlocked[0]);
          }
        }
      } catch (err) {
        console.warn('Erro ao processar pós-treino:', err);
      }
    })();
  }, [flameScale, flameOpacity, streakTextScale, hasPR]);

  // Transição para Etapa 2
  const handleGoToSummary = () => {
    Haptics.selectionAsync().catch(() => {});
    setStage('summary');
    summaryOpacity.setValue(0);
    summaryTranslateY.setValue(20);
    Animated.parallel([
      Animated.timing(summaryOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(summaryTranslateY, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
    ]).start();
  };

  // Concluir pós-treino
  const handleFinish = () => {
    if (unlockedAchievements.length > 0) {
      setShowAchievementModal(true);
      return;
    }
    goHome();
  };

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  // Compartilhamento
  const handleShare = async () => {
    Haptics.selectionAsync().catch(() => {});
    const shareMessage = `Treino DALLAS concluído! 🔥\nVolume: ${Math.round(volume)} kg | Séries: ${series} | Duração: ${formatDuration(durationSeconds)}\n#BuildYourBest #DALLAS`;

    try {
      // 1. Cria post na comunidade local
      await communityService.createPost(
        `Treino pago com sucesso! 🔥 ${Math.round(volume)} kg levantados em ${series} séries. Foco constante!`,
        undefined,
        'Treino Concluído',
      );
      setShared(true);

      // 2. Abre share sheet nativo para Stories / redes
      await Share.share({
        message: shareMessage,
      });
    } catch {
      // cancelado ou erro
    }
  };

  // Dias concluídos na semana corrente
  const trainedDaysOfWeek = React.useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 86400000;
    const set = new Set<number>();
    recentLogs
      .filter((l) => new Date(l.startedAt).getTime() >= oneWeekAgo)
      .forEach((l) => {
        set.add(new Date(l.startedAt).getDay());
      });
    // Adiciona o treino de hoje
    set.add(new Date().getDay());
    return set;
  }, [recentLogs]);

  const jsDayToWeekDayKey: Record<number, WeekDay> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };

  return (
    <Screen style={styles.screen}>
      {/* ================= ETAPA 1: CELEBRAÇÃO DA CONSISTÊNCIA ================= */}
      {stage === 'consistency' && (
        <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.centerSection}>
            {/* Chama Central com Glow e Animação */}
            <View style={styles.flameContainer}>
              <Animated.View
                style={[
                  styles.flameGlow,
                  {
                    opacity: flameOpacity,
                    transform: [{ scale: flameScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.flameIconWrap,
                  {
                    transform: [{ scale: flameScale }],
                  },
                ]}
              >
                <Icon name="flame" size={68} color="#FF1E27" />
              </Animated.View>
            </View>

            {/* Número da Sequência */}
            <Animated.View style={{ transform: [{ scale: streakTextScale }] }}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakUnit}>
                {streak === 1 ? 'TREINO NA SEQUÊNCIA' : 'TREINOS NA SEQUÊNCIA'}
              </Text>
            </Animated.View>

            <Text style={styles.consistencyMessage}>
              Compromisso cumprido! Seus descansos planejados preservaram o seu ritmo.
            </Text>

            {/* Mini Calendário Semanal Minimalista */}
            <View style={styles.miniCalendarBox}>
              <Text style={styles.miniCalendarTitle}>AGENDA DA SEMANA</Text>
              <View style={styles.daysRow}>
                {WEEKDAY_KEYS.map((item, idx) => {
                  const jsDay = idx === 6 ? 0 : idx + 1; // dom = 0
                  const isScheduled = userPrefs?.trainingDays
                    ? userPrefs.trainingDays.includes(item.key)
                    : true;
                  const isDone = trainedDaysOfWeek.has(jsDay);
                  const isToday = new Date().getDay() === jsDay;

                  return (
                    <View key={item.key} style={styles.dayCol}>
                      <Text style={[styles.dayShortText, isToday && styles.dayShortToday]}>
                        {item.short}
                      </Text>
                      <View
                        style={[
                          styles.dayCircle,
                          isDone && styles.dayCircleDone,
                          !isDone && isScheduled && styles.dayCircleScheduled,
                          !isDone && !isScheduled && styles.dayCircleRest,
                        ]}
                      >
                        {isDone ? (
                          <Icon name="check" size={12} color="#FFFFFF" />
                        ) : isScheduled ? (
                          <View style={styles.scheduledDot} />
                        ) : (
                          <View style={styles.restDot} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Botão de Avanço */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={handleGoToSummary}
          >
            <Text style={styles.primaryBtnText}>VER RESUMO DO TREINO</Text>
            <Icon name="chevronRight" size="sm" color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {/* ================= ETAPA 2: RESUMO GAMIFICADO ================= */}
      {stage === 'summary' && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity: summaryOpacity,
              transform: [{ translateY: summaryTranslateY }],
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={styles.centerSection}>
            {/* Hero com Mascote Comemorando */}
            <View style={styles.heroWrap}>
              <View style={styles.mascotCircle}>
                <Image
                  source={require('../../assets/dallas/dallas_feliz.png')}
                  style={styles.mascotHero}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.heroTitle}>MISSÃO CUMPRIDA!</Text>
              <Text style={styles.heroSubtitle}>Dallas aprovou seu treino com louvor. 🔥</Text>
            </View>

            {/* Card de PR (se houver) */}
            {hasPR ? (
              <View style={styles.prCard}>
                <Icon name="trophy" size={20} color="#FFD700" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.prTitle}>NOVO RECORDE PESSOAL!</Text>
                  <Text style={styles.prSubtitle}>Você superou seus limites nesta sessão.</Text>
                </View>
              </View>
            ) : null}

            {/* Bento Grid */}
            <View style={styles.bentoGrid}>
              <View style={[styles.bentoBox, styles.bentoBoxWide]}>
                <View style={styles.bentoIconRow}>
                  <Icon name="weight" size={18} color="#FF1E27" />
                  <Text style={styles.bentoLabel}>CARGA TOTAL LEVANTADA</Text>
                </View>
                <Text style={styles.bentoValue}>
                  {Math.round(volume).toLocaleString('pt-BR')} <Text style={styles.bentoUnit}>kg</Text>
                </Text>
              </View>

              <View style={styles.bentoRow}>
                <View style={[styles.bentoBox, styles.bentoBoxHalf]}>
                  <View style={styles.bentoIconRow}>
                    <Icon name="clock" size={16} color="#FF1E27" />
                    <Text style={styles.bentoLabel}>TEMPO TOTAL</Text>
                  </View>
                  <Text style={styles.bentoValueSmall}>
                    {formatDuration(durationSeconds)}
                  </Text>
                </View>

                <View style={[styles.bentoBox, styles.bentoBoxHalf]}>
                  <View style={styles.bentoIconRow}>
                    <Icon name="checkmarkDone" size={16} color="#FF1E27" />
                    <Text style={styles.bentoLabel}>SÉRIES</Text>
                  </View>
                  <Text style={styles.bentoValueSmall}>{series}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Ações da Etapa 2 */}
          <View style={styles.actionsFooter}>
            <Pressable
              style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
              onPress={handleShare}
            >
              <Icon name="share" size="sm" color="#FFFFFF" />
              <Text style={styles.shareBtnText}>
                {shared ? 'COMPARTILHADO NO FEED ✓' : 'COMPARTILHAR NO FEED'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.finishBtn, pressed && styles.pressed]}
              onPress={handleFinish}
            >
              <Text style={styles.finishBtnText}>CONCLUIR</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* ================= ETAPA 3: CONQUISTA CONDICIONAL ================= */}
      <AchievementModal
        visible={showAchievementModal}
        achievement={currentModalAchievement}
        onClose={() => {
          setShowAchievementModal(false);
          goHome();
        }}
        onViewAll={() => {
          setShowAchievementModal(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Profile' } }],
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#070709',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 32,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Chama
  flameContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  flameGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 30, 39, 0.28)',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 12,
  },
  flameIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  streakUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF1E27',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
  },
  consistencyMessage: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 14,
    maxWidth: 280,
  },
  // Mini Calendário
  miniCalendarBox: {
    width: '100%',
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222228',
    padding: 16,
    marginTop: 28,
  },
  miniCalendarTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 14,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayShortText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717A',
  },
  dayShortToday: {
    color: '#FF1E27',
    fontWeight: '900',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleDone: {
    backgroundColor: '#FF1E27',
  },
  dayCircleScheduled: {
    backgroundColor: '#18181D',
    borderWidth: 1.5,
    borderColor: '#3F3F46',
  },
  dayCircleRest: {
    backgroundColor: '#101013',
  },
  scheduledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#71717A',
  },
  restDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
  },
  // Hero Etapa 2
  heroWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mascotCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#121215',
    borderWidth: 2,
    borderColor: 'rgba(255, 30, 39, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  mascotHero: {
    width: 80,
    height: 80,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 4,
  },
  prCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  prTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.8,
  },
  prSubtitle: {
    fontSize: 11,
    color: '#E4E4E7',
    marginTop: 2,
  },
  // Bento Grid
  bentoGrid: {
    width: '100%',
    gap: 10,
  },
  bentoBox: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222228',
    padding: 16,
  },
  bentoBoxWide: {
    width: '100%',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoBoxHalf: {
    flex: 1,
  },
  bentoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  bentoValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  bentoUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF1E27',
  },
  bentoValueSmall: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // Botões
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF1E27',
    borderRadius: 16,
    paddingVertical: 17,
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  actionsFooter: {
    gap: 12,
    width: '100%',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF1E27',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  finishBtn: {
    backgroundColor: '#121215',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 30, 39, 0.45)',
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
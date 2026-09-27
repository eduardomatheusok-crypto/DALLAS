import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { Icon } from '../../theme/icons';
import ProgressBar from '../common/ProgressBar';
import { playCountdownHaptic, playTimerZeroVibration } from '../../services/soundService';
import type { RestTimerPhase } from '../../services';

export interface RestTimerOverlayProps {
  /** Milissegundos restantes do descanso. */
  remainingMs: number;
  /** Duração total do descanso em ms. */
  totalMs: number;
  /** Título do intervalo (ex.: "DESCANSO"). */
  title: string;
  /** Subtítulo informando a próxima etapa (ex.: "Supino Reto"). */
  subtitle: string;
  /** Fase do cronômetro: 'intro' (3-2-1 inicial), 'resting' (descanso normal) ou 'outro' (3-2-1 final). */
  phase?: RestTimerPhase;
  /** Segundos restantes da contagem inicial (3, 2, 1). */
  introRemainingSeconds?: number;
  /** Número da série que acabou de ser concluída (ex.: 1). */
  setNumber?: number;
  /** Nome do exercício. */
  exerciseName?: string;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  /** Pula a contagem inicial e começa o descanso imediatamente. */
  onSkipIntro?: () => void;
  onAddSeconds?: (seconds: number) => void;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RestTimerOverlay({
  remainingMs,
  totalMs,
  title,
  subtitle,
  phase = 'resting',
  introRemainingSeconds = 0,
  setNumber = 1,
  exerciseName,
  paused,
  onPause,
  onResume,
  onSkip,
  onSkipIntro,
  onAddSeconds,
}: RestTimerOverlayProps) {
  const [minimized, setMinimized] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastSecondRef = useRef<number | null>(null);
  const hasFinishedVibrationRef = useRef(false);

  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0;
  const totalRestSeconds = Math.max(0, Math.round(totalMs / 1000));
  const exName = exerciseName || subtitle;

  const currentCount = phase === 'intro' ? introRemainingSeconds : remainingSeconds;

  // Vibração e tremor do relógio nas fases de contagem 3 → 2 → 1 (intro e outro)
  useEffect(() => {
    if (paused) return;

    if (phase === 'intro' || phase === 'outro') {
      if (currentCount > 0 && currentCount !== lastSecondRef.current) {
        lastSecondRef.current = currentCount;

        // Feedback tátil em cada segundo (3, 2, 1)
        playCountdownHaptic(currentCount);

        // Intensidade progressiva do shake: 3s -> 4px, 2s -> 8px, 1s -> 13px
        const intensity = currentCount === 1 ? 13 : currentCount === 2 ? 8 : 4;

        Animated.parallel([
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: intensity, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -intensity, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: intensity * 0.5, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 80, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          ]),
        ]).start();
      }
    } else {
      // Durante descanso normal estável: relógio parado e sem tremer!
      shakeAnim.setValue(0);
      pulseAnim.setValue(1);
      lastSecondRef.current = null;
      hasFinishedVibrationRef.current = false;
    }
  }, [currentCount, phase, paused, shakeAnim, pulseAnim]);

  // Vibração dupla final ao zerar o descanso
  useEffect(() => {
    if (phase === 'outro' && remainingSeconds === 0 && !hasFinishedVibrationRef.current) {
      hasFinishedVibrationRef.current = true;
      playTimerZeroVibration();
    }
  }, [phase, remainingSeconds]);

  // =========================================================================
  // 1. MODAL CENTRAL (Fase 'intro' 3-2-1 inicial e 'outro' 3-2-1 final)
  // Baseado fielmente na imagem de referência visual anexada (fundo escuro,
  // badge vermelho de relógio com pulso/shake, número gigante, botões DALLAS).
  // =========================================================================
  const showCenterModal = (phase === 'intro' && introRemainingSeconds > 0) || (phase === 'outro' && remainingSeconds > 0 && remainingSeconds <= 3);

  if (showCenterModal) {
    const isIntro = phase === 'intro';
    const countdownValue = isIntro ? introRemainingSeconds : remainingSeconds;

    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Badge de Relógio com Shake e Pulso */}
            <Animated.View
              style={[
                styles.clockBadge,
                {
                  transform: [
                    { translateX: shakeAnim },
                    { scale: pulseAnim },
                  ],
                },
              ]}
            >
              <Icon name="clock" size="md" color="#FFFFFF" />
            </Animated.View>

            {/* Overline vermelho de status */}
            <Text style={styles.modalOverline}>
              {isIntro ? `SÉRIE ${setNumber} CONCLUÍDA` : 'DESCANSO TERMINANDO'}
            </Text>

            {/* Título de destaque */}
            <Text style={styles.modalTitle}>
              {isIntro ? 'O seu timer irá começar\nem:' : 'O seu descanso irá terminar\nem:'}
            </Text>

            {/* Número Gigante da Contagem */}
            <Text style={styles.modalNumber}>{countdownValue}</Text>

            {/* Subtítulo Segundos */}
            <Text style={styles.modalSecondsLabel}>SEGUNDOS</Text>

            {/* Detalhe do descanso e exercício */}
            <Text style={styles.modalDetailText} numberOfLines={1}>
              {isIntro
                ? `Descanso de ${totalRestSeconds}s · ${exName}`
                : `Prepare-se para a próxima série · ${exName}`}
            </Text>

            {/* Ações Inferiores */}
            <View style={styles.modalActionsRow}>
              {isIntro ? (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.modalSecondaryBtn, pressed && styles.pressed]}
                    onPress={onSkip}
                  >
                    <Text style={styles.modalSecondaryBtnText}>Pular descanso</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
                    onPress={onSkipIntro ?? onResume}
                  >
                    <View style={styles.playIconRow}>
                      <Icon name="play" size="xs" color="#FFFFFF" />
                      <Text style={styles.modalPrimaryBtnText}>Iniciar agora</Text>
                    </View>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.modalSecondaryBtn, pressed && styles.pressed]}
                    onPress={onSkip}
                  >
                    <Text style={styles.modalSecondaryBtnText}>Pular</Text>
                  </Pressable>

                  {onAddSeconds ? (
                    <Pressable
                      style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
                      onPress={() => onAddSeconds(30)}
                    >
                      <Text style={styles.modalPrimaryBtnText}>+30s Mais</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // =========================================================================
  // 2. MODO MINIMIZADO (Barra flutuante compacta no rodapé)
  // Permite ao usuário continuar utilizando e navegando pela tela de treino.
  // =========================================================================
  if (minimized) {
    return (
      <View style={styles.floatingBar}>
        <Pressable
          style={styles.floatingLeft}
          onPress={() => setMinimized(false)}
        >
          <View style={[styles.dot, paused && styles.dotPaused]} />
          <Text style={styles.floatingTime}>{formatCountdown(remainingMs)}</Text>
          <Text style={styles.floatingLabel} numberOfLines={1}>
            {paused ? 'PAUSADO' : 'DESCANSO'}
          </Text>
        </Pressable>

        <View style={styles.floatingActions}>
          {onAddSeconds ? (
            <Pressable
              style={({ pressed }) => [styles.pillBtn, pressed && styles.pressed]}
              onPress={() => onAddSeconds(30)}
            >
              <Text style={styles.pillBtnText}>+30s</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.pillBtn, styles.pillBtnPrimary, pressed && styles.pressed]}
            onPress={onSkip}
          >
            <Text style={styles.pillBtnPrimaryText}>Pular</Text>
          </Pressable>

          <Pressable
            style={styles.expandIconBtn}
            onPress={() => setMinimized(false)}
            hitSlop={8}
          >
            <Icon name="chevronUp" size={16} color="#A1A1AA" />
          </Pressable>
        </View>
      </View>
    );
  }

  // =========================================================================
  // 3. MODO NORMAL ESTÁVEL (Card completo de descanso)
  // Layout fiel: tempo grande, barra de progresso, mascote, nome do exercício
  // e controles (+30s, -15s, Pausar e Pular Descanso). Sem relógio tremendo!
  // =========================================================================
  return (
    <View style={styles.card}>
      {/* Header com toggle de minimizar */}
      <View style={styles.headRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.dot, paused && styles.dotPaused]} />
          <Text style={styles.caption}>{paused ? 'DESCANSO PAUSADO' : title}</Text>
        </View>

        <View style={styles.headRight}>
          <Pressable
            onPress={() => setMinimized(true)}
            hitSlop={8}
            style={styles.minimizeBtn}
          >
            <Icon name="chevronDown" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Contagem Principal Grande & Mascote */}
      <View style={styles.countdownRow}>
        <View style={styles.countdownTextWrap}>
          <Text style={styles.countdown}>
            {formatCountdown(remainingMs)}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.mascotBadge}>
          <Image
            source={require('../../../assets/dallas/dallas_cansado.png')}
            style={styles.mascotThumb}
            resizeMode="contain"
          />
          <Text style={styles.mascotSpeech}>Respira!</Text>
        </View>
      </View>

      {/* Barra de Progresso */}
      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} />
      </View>

      {/* Atalhos: +30s, -15s, Pausar/Continuar, Pular */}
      <View style={styles.shortcutsRow}>
        {onAddSeconds ? (
          <View style={styles.quickAddGroup}>
            <Pressable
              style={({ pressed }) => [styles.shortcutBtn, pressed && styles.pressed]}
              onPress={() => onAddSeconds(30)}
            >
              <Text style={styles.shortcutBtnText}>+30s</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.shortcutBtn, pressed && styles.pressed]}
              onPress={() => onAddSeconds(-15)}
            >
              <Text style={styles.shortcutBtnText}>-15s</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.mainActions}>
          <Pressable
            onPress={paused ? onResume : onPause}
            style={({ pressed }) => [styles.pauseBtn, pressed && styles.pressed]}
          >
            <Icon name={paused ? 'play' : 'pause'} size="sm" color="#FFFFFF" />
            <Text style={styles.pauseBtnText}>{paused ? 'Retomar' : 'Pausar'}</Text>
          </Pressable>

          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
          >
            <Text style={styles.skipBtnText}>Pular Descanso</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Modal Central (3-2-1)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121215',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#24242A',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  clockBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FF1E27',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  modalOverline: {
    color: '#FF1E27',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  modalNumber: {
    fontSize: 82,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    marginVertical: 4,
  },
  modalSecondsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modalDetailText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalSecondaryBtn: {
    flex: 1,
    backgroundColor: '#1C1C20',
    borderWidth: 1,
    borderColor: '#2E2E36',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: '#FF1E27',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  playIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Card Normal de Descanso
  card: {
    backgroundColor: '#121215',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 30, 39, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: spacing.md,
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizeBtn: {
    padding: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF1E27',
  },
  dotPaused: {
    backgroundColor: '#71717A',
  },
  caption: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#FF1E27',
    textTransform: 'uppercase',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownTextWrap: {
    flex: 1,
  },
  countdown: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 4,
    fontWeight: '500',
  },
  mascotBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: spacing.md,
  },
  mascotThumb: {
    width: 58,
    height: 58,
  },
  mascotSpeech: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF1E27',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  progressWrap: {
    marginTop: 14,
    marginBottom: 16,
  },
  shortcutsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAddGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shortcutBtn: {
    backgroundColor: '#1E1E24',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  shortcutBtnText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '700',
  },
  mainActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1E24',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  pauseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  skipBtn: {
    backgroundColor: 'rgba(255, 30, 39, 0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FF1E27',
  },
  skipBtnText: {
    color: '#FF1E27',
    fontSize: 12,
    fontWeight: '700',
  },

  // Barra Flutuante (Modo Minimizado)
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141417',
    borderWidth: 1.5,
    borderColor: '#FF1E27',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: spacing.md,
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  floatingTime: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  floatingLabel: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  floatingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillBtn: {
    backgroundColor: '#202026',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#303038',
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4D4D8',
  },
  pillBtnPrimary: {
    backgroundColor: '#FF1E27',
    borderColor: '#FF1E27',
  },
  pillBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expandIconBtn: {
    padding: 4,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
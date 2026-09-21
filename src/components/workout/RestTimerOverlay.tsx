import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import ProgressBar from '../common/ProgressBar';

export interface RestTimerOverlayProps {
  /** Segundos restantes (fracionários por precisão). */
  remainingMs: number;
  /** Duração total em ms, para a barra de progresso. */
  totalMs: number;
  /** Título do intervalo (ex.: "DESCANSO"). */
  title: string;
  /** Subtítulo informando a próxima etapa (ex.: "Próxima série 3/4 · 8–12 reps"). */
  subtitle: string;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const body = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return h > 0 ? `${h}:${body}` : body;
}

/**
 * Painel de descanso da execução do treino.
 * Visual DALLAS: fundo escuro premium, vermelho de destaque, tipografia grande
 * para leitura durante o exercício. Funciona em claro e escuro via `colors`.
 */
export default function RestTimerOverlay({
  remainingMs,
  totalMs,
  title,
  subtitle,
  paused,
  onPause,
  onResume,
  onSkip,
}: RestTimerOverlayProps) {
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.dot, paused && styles.dotPaused]} />
          <Text style={styles.caption}>{paused ? 'DESCANSO PAUSADO' : title}</Text>
        </View>
        <Pressable onPress={onSkip} hitSlop={8} style={styles.skipButton}>
          <Text style={styles.skipText}>Pular</Text>
          <Icon name="chevronRight" size="xs" color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.countdown}>{formatCountdown(remainingMs)}</Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>

      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={paused ? onResume : onPause}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Icon name={paused ? 'play' : 'pause'} size="sm" color={colors.primary} />
          <Text style={styles.actionText}>{paused ? 'Continuar' : 'Pausar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dotPaused: {
    backgroundColor: colors.textMuted,
  },
  caption: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  countdown: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressWrap: {
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
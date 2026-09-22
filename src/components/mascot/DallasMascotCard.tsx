import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../theme';

// Assets do mascote Dallas
const MASCOT_ASSETS = {
  base: require('../../../assets/dallas/dallas_base.png'),
  cansado: require('../../../assets/dallas/dallas_cansado.png'),
  feliz: require('../../../assets/dallas/dallas_feliz.png'),
};

export interface DallasMascotCardProps {
  streak: number;
  hasTrainedToday: boolean;
  daysSinceLastWorkout: number;
  onPressAction?: () => void;
}

export default function DallasMascotCard({
  streak,
  hasTrainedToday,
  daysSinceLastWorkout,
  onPressAction,
}: DallasMascotCardProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Determina o estado emocional do Dallas com base na consistência
  let mood: 'feliz' | 'base' | 'cansado' = 'base';
  let badgeText = 'FOCO TOTAL ⚡';
  let badgeColor = colors.primary;
  let title = 'Dallas pronto pra ação';
  let quotes: string[] = [];

  if (hasTrainedToday) {
    mood = 'feliz';
    badgeText = 'NO SHAPE! 🔥';
    badgeColor = colors.success;
    title = 'Dallas tá comemorando!';
    quotes = [
      'Treino pago hoje! Cada repetição constrói o seu melhor.',
      'Sensação de dever cumprido! Agora o descanso é sagrado.',
      'Dallas aprovou a intensidade de hoje! Amanhã tem mais.',
    ];
  } else if (daysSinceLastWorkout >= 2 || (streak === 0 && daysSinceLastWorkout > 0)) {
    mood = 'cansado';
    badgeText = 'ENERGIA BAIXA 💤';
    badgeColor = colors.textSecondary;
    title = 'Dallas precisa de você!';
    quotes = [
      'Tô perdendo o fôlego aqui... bora treinar hoje pra recuperar o ritmo?',
      'Mesmo 30 minutinhos hoje já salvam o nosso ritmo!',
      'A disciplina começa quando a vontade acaba. Vem treinar!',
    ];
  } else {
    mood = 'base';
    badgeText = streak > 0 ? `${streak} DIAS SEGUIDOS ⚡` : 'HORA DO TREINO ⚡';
    badgeColor = colors.primary;
    title = streak > 0 ? 'Mantendo a sequência!' : 'Pronto para o treino?';
    quotes = [
      streak > 0
        ? `Bora manter o streak de ${streak} dia(s)? Não quebre o ritmo!`
        : 'Seu treino de hoje já está montado. Vamos lá!',
      'O único treino ruim é aquele que você não fez.',
      'Coloca o fone e vamos queimar calorias juntos!',
    ];
  }

  const currentQuote = quotes[quoteIndex % quotes.length];

  const handlePressMascot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.15, duration: 90, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
    ]).start();
    setQuoteIndex((prev) => prev + 1);
    onPressAction?.();
  };

  return (
    <Pressable style={styles.card} onPress={handlePressMascot}>
      <Animated.View style={[styles.imageWrap, { transform: [{ scale: bounceAnim }] }]}>
        <Image
          source={MASCOT_ASSETS[mood]}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.infoWrap}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { borderColor: badgeColor, backgroundColor: `${badgeColor}15` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.quote} numberOfLines={2}>
          "{currentQuote}"
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  imageWrap: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascotImage: {
    width: 68,
    height: 68,
  },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  quote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme, spacing, borderRadius } from '../../theme';
import { entryContent } from '../../entry/entryContent';
import EntryParticles from '../../components/entry/EntryParticles';

interface Props {
  onEnterPress: () => void;
  onCreatePress: () => void;
}

/**
 * Tela de entrada premium do DALLAS.
 * - Hero ~70-75% da tela com a fotografia de treino;
 * - partículas vermelhas sutis sobre o hero;
 * - transição diagonal/preto avançando sobre a imagem (wedge);
 * - área de interação separada (DALLAS → tagline → ENTRAR/CRIAR CONTA).
 */
export default function WelcomeScreen({ onEnterPress, onCreatePress }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { brand, tagline, primaryAction, secondaryAction, hero } = entryContent;

  return (
    <View style={styles.root}>
      {/* Área visual da imagem principal em contain (imagem completa, sem cortes) */}
      <View style={[styles.imageContainer, { paddingTop: insets.top + spacing.sm }]}>
        <Image source={hero.image} style={styles.image} resizeMode="contain" />
        <EntryParticles color={colors.primary} count={10} />
      </View>

      {/* Área própria e separada para a marca e os botões de ação */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colors.background,
            paddingBottom: Math.max(insets.bottom + spacing.xs, spacing.xl),
          },
        ]}
      >
        <Text style={[styles.brand, { color: colors.text }]}>{brand}</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>{tagline}</Text>

        <Pressable
          onPress={onEnterPress}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.buttonPrimary,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonPrimaryText}>{primaryAction}</Text>
        </Pressable>

        <Pressable
          onPress={onCreatePress}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.buttonSecondary,
            { borderColor: colors.border, borderStyle: 'solid' },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>
            {secondaryAction}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050505',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  panel: {
    gap: spacing.md,
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xl,
    backgroundColor: '#080808',
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 9, 20, 0.2)',
  },
  brand: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  buttonPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.md,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  buttonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.82,
  },
});
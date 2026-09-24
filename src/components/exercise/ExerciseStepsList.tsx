import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Exercise, ExerciseExecutionStep } from '../../models';
import { colors, borderRadius, typography, spacing } from '../../theme';
import { Icon } from '../../theme/icons';

interface ExerciseStepsListProps {
  exercise: Exercise;
  onSelectStepImage?: (imageUrl?: string) => void;
  style?: ViewStyle;
}

/**
 * Converte instruções e dados do exercício em etapas visuais estruturadas,
 * garantindo compatibilidade total com exercícios customizados ou legados.
 */
export function getExerciseSteps(exercise: Exercise): ExerciseExecutionStep[] {
  if (exercise.steps && exercise.steps.length > 0) {
    return exercise.steps;
  }

  const instructions = exercise.instructions || [];
  const startImg = exercise.startImage;
  const endImg = exercise.endImage;

  if (instructions.length >= 3) {
    return [
      {
        title: 'Posição inicial',
        description: instructions[0],
        image: startImg,
      },
      {
        title: 'Descida / Execução',
        description: instructions[1],
        image: endImg || startImg,
      },
      {
        title: 'Subida / Finalização',
        description: instructions[2],
        image: startImg || endImg,
      },
    ];
  }

  if (instructions.length === 2) {
    return [
      {
        title: 'Posição inicial',
        description: instructions[0],
        image: startImg,
      },
      {
        title: 'Movimento e contração',
        description: instructions[1],
        image: endImg || startImg,
      },
    ];
  }

  if (instructions.length === 1) {
    return [
      {
        title: 'Execução do movimento',
        description: instructions[0],
        image: startImg || endImg,
      },
    ];
  }

  // Fallback padrão se não houver instruções cadastradas
  return [
    {
      title: 'Posição inicial',
      description: 'Prepare o equipamento e alinhe a postura com o corpo estabilizado.',
      image: startImg,
    },
    {
      title: 'Contração e movimento',
      description: 'Execute o movimento com amplitude controlada e foco no músculo alvo.',
      image: endImg || startImg,
    },
  ];
}

export default function ExerciseStepsList({
  exercise,
  onSelectStepImage,
  style,
}: ExerciseStepsListProps) {
  const steps = getExerciseSteps(exercise);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const handleStepPress = (step: ExerciseExecutionStep, index: number) => {
    setActiveStepIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step.image && onSelectStepImage) {
      onSelectStepImage(step.image);
    }
  };

  if (steps.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {/* Cabeçalho da seção com ícone de livro e contador */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Icon name="notes" size="sm" color={colors.primary} />
          <Text style={styles.headerTitle}>Como executar</Text>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {activeStepIndex + 1} / {steps.length}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Siga as etapas abaixo para realizar o movimento com segurança.
      </Text>

      {/* Lista de cards das etapas */}
      <View style={styles.stepsList}>
        {steps.map((step, index) => {
          const isActive = activeStepIndex === index;
          const stepImageUri = step.image || (index === 0 ? exercise.startImage : exercise.endImage);

          return (
            <Pressable
              key={index}
              onPress={() => handleStepPress(step, index)}
              style={({ pressed }) => [
                styles.stepCard,
                isActive && styles.stepCardActive,
                pressed && styles.stepCardPressed,
              ]}
            >
              {/* Miniatura da etapa */}
              <View style={styles.thumbWrapper}>
                {stepImageUri ? (
                  <Image
                    source={{ uri: stepImageUri }}
                    style={styles.stepThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Icon name="muscle" size="sm" color={colors.textMuted} />
                  </View>
                )}
              </View>

              {/* Informações da etapa */}
              <View style={styles.stepInfo}>
                <View style={styles.titleRow}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>

                <Text style={styles.stepDescription} numberOfLines={4}>
                  {step.description}
                </Text>
              </View>

              {/* Seta indicativa à direita */}
              <View style={styles.arrowWrap}>
                <Icon
                  name="chevronRight"
                  size="xs"
                  color={isActive ? colors.primaryLight : colors.textMuted}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  counterBadge: {
    backgroundColor: colors.surfaceLighter,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  counterText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  stepsList: {
    gap: spacing.sm,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  stepCardActive: {
    borderColor: 'rgba(229, 9, 20, 0.45)',
    backgroundColor: '#161616',
  },
  stepCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  thumbWrapper: {
    width: 96,
    height: 68,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepThumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  numberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  stepTitle: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  stepDescription: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: '#B0B0B0',
  },
  arrowWrap: {
    paddingRight: 2,
  },
});

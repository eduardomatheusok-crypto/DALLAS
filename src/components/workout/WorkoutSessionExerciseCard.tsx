import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '../../theme';
import { Icon } from '../../theme/icons';

export interface WorkoutSessionExerciseCardProps {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  imageUrl?: string;
  plannedSets: number;
  plannedReps: number;
  completedSets?: number;
  isCompleted: boolean;
  isActive?: boolean;
  onPress: () => void;
  onToggleComplete: () => void;
}

export default function WorkoutSessionExerciseCard({
  name,
  muscleGroup,
  equipment,
  imageUrl,
  plannedSets,
  plannedReps,
  completedSets,
  isCompleted,
  isActive = false,
  onPress,
  onToggleComplete,
}: WorkoutSessionExerciseCardProps) {
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggleComplete();
  };

  const handlePressCard = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  // Monta a tag de subtítulo (ex: "Peito · Barra")
  const subtitle = [muscleGroup, equipment].filter(Boolean).join(' · ');

  // Resumo de séries e repetições (ex: "3 séries × 10 reps")
  const seriesInfo = `${plannedSets} ${plannedSets === 1 ? 'série' : 'séries'} × ${plannedReps} reps`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        (isActive || isCompleted) && styles.cardActive,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePressCard}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.05)' }}
    >
      {/* Botão de Check Circular (Esquerda) */}
      <Pressable
        style={styles.checkTouchArea}
        onPress={handleToggle}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
      >
        <View style={[styles.checkCircle, isCompleted && styles.checkCircleCompleted]}>
          {isCompleted && (
            <Icon name="check" size={14} color="#FFFFFF" />
          )}
        </View>
      </Pressable>

      {/* Thumbnail do Exercício */}
      <View style={styles.thumbnailContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Icon name="dumbbell" size={20} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Textos Informativos */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={styles.seriesInfo} numberOfLines={1}>
          {seriesInfo}
        </Text>
      </View>

      {/* Seta Chevron Indicadora (Direita) */}
      <View style={styles.chevronContainer}>
        <Icon name="chevronRight" size={18} color="#636366" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#26262A',
  },
  cardActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    borderColor: 'rgba(229, 9, 20, 0.45)',
  },
  cardPressed: {
    opacity: 0.88,
  },
  checkTouchArea: {
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.8,
    borderColor: '#48484A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkCircleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  thumbnailContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0D0D0E',
    borderWidth: 1,
    borderColor: '#26262A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.caption,
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  seriesInfo: {
    ...typography.caption,
    color: '#A1A1AA',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  chevronContainer: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

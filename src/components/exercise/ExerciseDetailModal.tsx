import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Exercise } from '../../models';
import { colors, borderRadius, typography, spacing } from '../../theme';
import { Icon } from '../../theme/icons';
import ExerciseMediaViewer from './ExerciseMediaViewer';
import ExerciseStepsList from './ExerciseStepsList';
import DallasExerciseTip from './DallasExerciseTip';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
  onSelectAction?: (exercise: Exercise) => void;
  selectActionLabel?: string;
}

export default function ExerciseDetailModal({
  exercise,
  visible,
  onClose,
  onSelectAction,
  selectActionLabel,
}: ExerciseDetailModalProps) {
  const [autoAnimate, setAutoAnimate] = useState(false);
  const [focusedImage, setFocusedImage] = useState<string | undefined>(undefined);

  if (!exercise) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleInfo}>
              <Text style={styles.title} numberOfLines={2}>
                {exercise.name}
              </Text>
              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{exercise.muscleGroup}</Text>
                </View>
                {exercise.equipment && (
                  <View style={[styles.badge, styles.equipBadge]}>
                    <Text style={styles.equipBadgeText}>{exercise.equipment}</Text>
                  </View>
                )}
                {exercise.isCustom && (
                  <View style={[styles.badge, styles.customBadge]}>
                    <Text style={styles.customBadgeText}>Personalizado</Text>
                  </View>
                )}
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Icon name="close" size="md" color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Visualizador de Mídia Principal (Início / Fim) */}
            <View style={styles.mediaSection}>
              <ExerciseMediaViewer
                startImage={focusedImage || exercise.startImage}
                endImage={exercise.endImage}
                autoAnimate={autoAnimate}
              />
              {exercise.startImage && exercise.endImage && (
                <Pressable
                  onPress={() => {
                    setAutoAnimate((prev) => !prev);
                    setFocusedImage(undefined);
                  }}
                  style={[
                    styles.animToggleBtn,
                    autoAnimate && styles.animToggleBtnActive,
                  ]}
                >
                  <Icon
                    name="sparkles"
                    size="xs"
                    color={colors.white}
                  />
                  <Text style={styles.animToggleText}>
                    {autoAnimate ? 'Pausar Animação' : 'Animar Movimento'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Nova Seção Estruturada: "Como executar" com cards de etapas */}
            <ExerciseStepsList
              exercise={exercise}
              onSelectStepImage={(imgUrl) => {
                setAutoAnimate(false);
                setFocusedImage(imgUrl);
              }}
            />

            {/* Dica do Dallas */}
            {exercise.dallasTip && (
              <DallasExerciseTip tip={exercise.dallasTip} style={styles.tipCard} />
            )}

            {/* Músculos Envolvidos */}
            {((exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) || exercise.muscleGroup) && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Icon name="fitness" size="sm" color={colors.primary} />
                  <Text style={styles.sectionTitle}>Músculos envolvidos</Text>
                </View>
                <View style={styles.tagsWrap}>
                  {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 ? (
                    exercise.secondaryMuscles.map((muscle) => (
                      <View key={muscle} style={styles.tag}>
                        <Text style={styles.tagText}>{muscle}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{exercise.muscleGroup}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Botão de Ação Opcional (ex: Substituir ou Selecionar) */}
          {onSelectAction && selectActionLabel && (
            <View style={styles.footer}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  onSelectAction(exercise);
                  onClose();
                }}
              >
                <Text style={styles.actionButtonText}>{selectActionLabel}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.surfaceLighter,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  equipBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  equipBadgeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  customBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  customBadgeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.successLight,
    fontWeight: '600',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  mediaSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  animToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  animToggleBtnActive: {
    backgroundColor: colors.primaryDark,
  },
  animToggleText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },
  tipCard: {
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#161616',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
  },
});

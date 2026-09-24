import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useExercises } from '../hooks';
import {
  Card,
  LoadingState,
  EmptyState,
  MuscleGroupPill,
  Button,
  Screen,
} from '../components/common';
import {
  MUSCLE_GROUPS,
  EXERCISE_EQUIPMENTS,
  type MuscleGroup,
  type ExerciseEquipment,
  type Exercise,
} from '../models';
import { exerciseService } from '../services';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';
import { ExerciseMediaViewer, ExerciseDetailModal } from '../components/exercise';

export default function ExercisesScreen() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | undefined>(undefined);
  const [equipment, setEquipment] = useState<ExerciseEquipment | undefined>(undefined);
  const [createVisible, setCreateVisible] = useState(false);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  const { exercises, loading, reload } = useExercises(query, group);

  // Filtra por equipamento em memória sobre o resultado já filtrado por grupo/busca
  const filteredExercises = useMemo(() => {
    if (!equipment) return exercises;
    return exercises.filter((e) => e.equipment === equipment);
  }, [exercises, equipment]);

  const groups: { group: MuscleGroup | 'Todos' }[] = [
    { group: 'Todos' },
    ...MUSCLE_GROUPS.map((g) => ({ group: g })),
  ];

  const equipments: { equip: ExerciseEquipment | 'Todos' }[] = [
    { equip: 'Todos' },
    ...EXERCISE_EQUIPMENTS.map((eq) => ({ equip: eq })),
  ];

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={typography.overline}>Biblioteca</Text>
          <Text style={[typography.title, styles.title]}>Exercícios</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.newButton,
            pressed && styles.newButtonPressed,
          ]}
          onPress={() => setCreateVisible(true)}
        >
          <Icon name="plus" size="sm" color={colors.white} />
          <Text style={styles.newButtonText}>Novo</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Icon name="search" size="sm" color={colors.textMuted} />
        <TextInput
          style={styles.search}
          placeholder="Buscar exercício..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Icon name="close" size="xs" color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filtro de Grupos Musculares */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={groups}
          keyExtractor={(item) => item.group}
          renderItem={({ item }) => (
            <MuscleGroupPill
              label={item.group}
              active={group === item.group || (item.group === 'Todos' && group === undefined)}
              onPress={() => setGroup(item.group === 'Todos' ? undefined : item.group)}
            />
          )}
        />
      </View>

      {/* Filtro secundário por Equipamento */}
      <View style={styles.equipFilterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={equipments}
          keyExtractor={(item) => item.equip}
          renderItem={({ item }) => {
            const isActive =
              equipment === item.equip || (item.equip === 'Todos' && equipment === undefined);
            return (
              <Pressable
                onPress={() => setEquipment(item.equip === 'Todos' ? undefined : item.equip)}
                style={[styles.equipPill, isActive && styles.equipPillActive]}
              >
                <Text style={[styles.equipPillText, isActive && styles.equipPillTextActive]}>
                  {item.equip}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="muscle"
              title="Nenhum exercício"
              message="Ajuste os filtros ou cadastre um novo exercício personalizado."
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => setDetailExercise(item)}>
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  {/* Thumbnail com foto do exercício */}
                  <ExerciseMediaViewer
                    startImage={item.startImage}
                    endImage={item.endImage}
                    mode="thumbnail"
                  />

                  {/* Informações */}
                  <View style={styles.info}>
                    <Text style={[typography.body, styles.exerciseName]} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <View style={styles.tagsRow}>
                      <Text style={styles.muscleLabel}>{item.muscleGroup}</Text>

                      {item.equipment && (
                        <View style={styles.equipBadge}>
                          <Text style={styles.equipBadgeText}>{item.equipment}</Text>
                        </View>
                      )}

                      {item.isCustom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>personalizado</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Seta indicando detalhes */}
                  <View style={styles.arrowWrap}>
                    <Icon name="chevron-forward" size="sm" color={colors.textMuted} />
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}

      {/* Modal com detalhes completos do exercício */}
      <ExerciseDetailModal
        exercise={detailExercise}
        visible={!!detailExercise}
        onClose={() => setDetailExercise(null)}
      />

      <CreateExerciseModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={async () => {
          await reload();
          setCreateVisible(false);
        }}
      />
    </Screen>
  );
}

function CreateExerciseModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState<MuscleGroup>('Peito');
  const [equipment, setEquipment] = useState<ExerciseEquipment>('Halteres');
  const [tip, setTip] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await exerciseService.createCustom(
      name.trim(),
      group,
      equipment,
      tip.trim() || undefined
    );
    setSaving(false);
    setName('');
    setTip('');
    setGroup('Peito');
    setEquipment('Halteres');
    await onCreated();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={typography.subtitle}>Novo exercício</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Icon name="close" size="sm" color={colors.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Nome do exercício (ex: Supino com pegada fechada)"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, styles.tipInput]}
            placeholder="Dica de postura / execução (opcional)"
            placeholderTextColor={colors.textMuted}
            value={tip}
            onChangeText={setTip}
            multiline
          />

          <Text style={styles.groupLabel}>Grupo muscular</Text>
          <View style={styles.groupWrap}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={MUSCLE_GROUPS}
              keyExtractor={(g) => g}
              renderItem={({ item }) => (
                <MuscleGroupPill
                  label={item}
                  active={group === item}
                  onPress={() => setGroup(item)}
                />
              )}
            />
          </View>

          <Text style={styles.groupLabel}>Equipamento</Text>
          <View style={styles.groupWrap}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={EXERCISE_EQUIPMENTS}
              keyExtractor={(eq) => eq}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setEquipment(item)}
                  style={[
                    styles.equipPill,
                    equipment === item && styles.equipPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.equipPillText,
                      equipment === item && styles.equipPillTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={onClose}
              style={styles.flexButton}
            />
            <Button
              title="Salvar"
              onPress={submit}
              loading={saving}
              disabled={!name.trim()}
              style={styles.flexButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.xs,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  newButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  newButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  search: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    color: colors.text,
  },
  filterSection: {
    marginBottom: spacing.xs,
  },
  equipFilterSection: {
    marginBottom: spacing.xs,
  },
  equipPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  equipPillActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderColor: colors.primary,
  },
  equipPillText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  equipPillTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontWeight: '600',
    color: colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  equipBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  equipBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  customBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  customBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.successLight,
  },
  arrowWrap: {
    paddingLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    marginTop: spacing.md,
  },
  tipInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  groupLabel: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  groupWrap: {
    marginBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
});

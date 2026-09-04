import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useExercises } from '../../hooks';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import type { Exercise, MuscleGroup } from '../../models';
import { MUSCLE_GROUPS } from '../../models';
import MuscleGroupPill from './MuscleGroupPill';
import { Button } from './Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
  selectedIds: string[];
  onCreateCustom?: (name: string, muscleGroup: MuscleGroup) => Promise<Exercise>;
}

export default function ExercisePickerModal({
  visible,
  onClose,
  onAdd,
  selectedIds,
  onCreateCustom,
}: Props) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | undefined>(undefined);
  const [createName, setCreateName] = useState('');
  const [createGroup, setCreateGroup] = useState<MuscleGroup>('Peito');
  const [creating, setCreating] = useState(false);
  const { exercises, loading, reload } = useExercises(query, group);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setGroup(undefined);
      setCreateName('');
    }
  }, [visible]);

  const available = exercises.filter((e) => !selectedIds.includes(e.id));

  const createNew = async () => {
    if (!createName.trim() || !onCreateCustom) return;
    setCreating(true);
    try {
      const created = await onCreateCustom(createName.trim(), createGroup);
      onAdd(created);
      setCreateName('');
      setCreating(false);
    } catch {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.subtitle}>Adicionar exercício</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Icon name="close" size="sm" color={colors.textSecondary} />
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
          </View>

          <View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={
                [{ group: 'Todos' as MuscleGroup | 'Todos' }, ...MUSCLE_GROUPS.map((g) => ({ group: g as MuscleGroup | 'Todos' }))]
              }
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

          <FlatList
            data={available}
            keyExtractor={(item) => item.id}
            style={styles.list}
            ListEmptyComponent={
              !loading ? (
                <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xxl }]}>
                  Nenhum exercício encontrado
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onAdd(item);
                }}
              >
                <View style={styles.rowText}>
                  <Text style={typography.body}>{item.name}</Text>
                  <Text style={typography.small}>{item.muscleGroup}</Text>
                </View>
                <View style={styles.addIconWrap}>
                  <Icon name="plus" size="sm" color={colors.white} />
                </View>
              </Pressable>
            )}
          />
          {onCreateCustom ? (
            <View style={styles.createArea}>
              <Text style={[typography.label, styles.createLabel]}>
                Não achou? Crie um novo exercício
              </Text>
              <View style={styles.createRow}>
                <TextInput
                  style={[styles.search, styles.createInput]}
                  placeholder="Nome do exercício"
                  placeholderTextColor={colors.textMuted}
                  value={createName}
                  onChangeText={setCreateName}
                />
              </View>
              <Text style={[typography.small, styles.createLabel]}>Grupo muscular</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[...MUSCLE_GROUPS]}
                keyExtractor={(g) => g}
                style={styles.createGroups}
                renderItem={({ item }) => (
                  <MuscleGroupPill
                    label={item}
                    active={createGroup === item}
                    onPress={() => setCreateGroup(item)}
                  />
                )}
              />
              <Button
                title="Criar e adicionar"
                variant="secondary"
                onPress={createNew}
                loading={creating}
                disabled={!createName.trim()}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  close: {
    fontSize: 20,
    color: colors.textSecondary,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  list: {
    marginTop: spacing.md,
    maxHeight: 280,
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  plus: {
    fontSize: 24,
    color: colors.primary,
    marginLeft: spacing.md,
  },
  createArea: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createLabel: {
    marginBottom: spacing.sm,
  },
  createInput: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
  },
  createRow: {
    marginBottom: spacing.xs,
  },
  createGroups: {
    marginBottom: spacing.md,
  },
});

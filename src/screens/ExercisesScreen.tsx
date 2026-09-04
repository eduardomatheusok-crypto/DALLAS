import React, { useState } from 'react';
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
import { MUSCLE_GROUPS, type MuscleGroup } from '../models';
import { exerciseService } from '../services';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';

export default function ExercisesScreen() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | undefined>(undefined);
  const [createVisible, setCreateVisible] = useState(false);
  const { exercises, loading, reload } = useExercises(query, group);

  const groups: { group: MuscleGroup | 'Todos' }[] = [
    { group: 'Todos' },
    ...MUSCLE_GROUPS.map((g) => ({ group: g })),
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
      </View>

      <View>
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

      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="muscle"
              title="Nenhum exercício"
              message="Crie um exercício personalizado ou ajuste a busca."
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text style={typography.body}>{item.name}</Text>
                  <Text style={typography.small}>{item.muscleGroup}</Text>
                </View>
                {item.isCustom ? (
                  <View style={styles.badge}>
                    <Icon name="checkmark-done" size="xs" color={colors.primaryLight} />
                    <Text style={styles.badgeText}>personalizado</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          )}
        />
      )}

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
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await exerciseService.createCustom(name.trim(), group);
    setSaving(false);
    setName('');
    setGroup('Peito');
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
            placeholder="Nome do exercício"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
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
  list: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.scrim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '600',
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
    marginTop: spacing.lg,
  },
  groupLabel: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  groupWrap: {
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
});

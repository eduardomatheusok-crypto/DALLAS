import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  EmptyState,
  LoadingState,
  Screen,
  MenuSheet,
  Button,
} from '../components/common';
import WorkoutCard from '../components/workout/WorkoutCard';
import { useWorkouts, useExercises } from '../hooks';
import { workoutService } from '../services';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';
import ConfirmationModal from '../components/common/ConfirmationModal';
import type { Workout } from '../models';

type Nav = StackNavigationProp<RootStackParamList>;

const MUSCLE_TAGS = [
  'Todos',
  'Peito',
  'Costas',
  'Ombros',
  'Pernas',
  'Bíceps',
  'Tríceps',
];

// Pre-defined workout templates for the "Modelos" tab
const WORKOUT_TEMPLATES: Workout[] = [
  {
    id: 'template-upper-a',
    name: 'UPPER A',
    exercises: [
      { exerciseId: 'supino-reto', order: 1, plannedSets: 4, plannedReps: 10 },
      { exerciseId: 'remada-curvada', order: 2, plannedSets: 4, plannedReps: 10 },
      { exerciseId: 'desenvolvimento-halteres', order: 3, plannedSets: 3, plannedReps: 12 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-lower-a',
    name: 'LOWER A',
    exercises: [
      { exerciseId: 'agachamento-livre', order: 1, plannedSets: 4, plannedReps: 8 },
      { exerciseId: 'leg-press', order: 2, plannedSets: 4, plannedReps: 10 },
      { exerciseId: 'cadeira-extensora', order: 3, plannedSets: 3, plannedReps: 12 },
      { exerciseId: 'stiff', order: 4, plannedSets: 3, plannedReps: 10 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-upper-b',
    name: 'UPPER B',
    exercises: [
      { exerciseId: 'supino-inclinado', order: 1, plannedSets: 4, plannedReps: 10 },
      { exerciseId: 'puxada-alta', order: 2, plannedSets: 4, plannedReps: 10 },
      { exerciseId: 'elevacao-lateral', order: 3, plannedSets: 4, plannedReps: 12 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-lower-b',
    name: 'LOWER B',
    exercises: [
      { exerciseId: 'levantamento-terra', order: 1, plannedSets: 4, plannedReps: 6 },
      { exerciseId: 'mesa-flexora', order: 2, plannedSets: 4, plannedReps: 10 },
      { exerciseId: 'panturrilha-pe', order: 3, plannedSets: 4, plannedReps: 15 },
      { exerciseId: 'elevacao-pelvica', order: 4, plannedSets: 3, plannedReps: 12 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();
  const { workouts, loading, reload } = useWorkouts();
  const { exercises, reload: reloadExercises } = useExercises();

  const [activeTab, setActiveTab] = useState<'my' | 'templates'>('my');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [renameFor, setRenameFor] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      reload();
      reloadExercises();
    }, [reload, reloadExercises]),
  );

  const confirmDelete = async () => {
    if (!toDelete) return;
    await workoutService.deleteWorkout(toDelete);
    setToDelete(null);
    await reload();
  };

  const duplicate = async () => {
    if (!menuFor) return;
    await workoutService.duplicateWorkout(menuFor);
    setMenuFor(null);
    await reload();
  };

  const importTemplate = async (template: Workout) => {
    await workoutService.saveWorkout(template.name, template.exercises);
    await reload();
    setActiveTab('my');
  };

  const openRename = () => {
    if (!menuFor) return;
    setRenameFor(menuFor);
    setMenuFor(null);
  };

  const displayedWorkouts = useMemo(() => {
    const list = activeTab === 'my' ? workouts : WORKOUT_TEMPLATES;
    if (selectedMuscle === 'Todos') return list;

    return list.filter((w) => {
      const matchInName = w.name.toLowerCase().includes(selectedMuscle.toLowerCase());
      if (matchInName) return true;
      return w.exercises.some((we) => {
        const ex = exercises.find((e) => e.id === we.exerciseId || e.name === we.exerciseId);
        return ex?.muscleGroup?.toLowerCase() === selectedMuscle.toLowerCase();
      });
    });
  }, [activeTab, workouts, selectedMuscle, exercises]);

  return (
    <Screen scroll={false} style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>SUA BIBLIOTECA</Text>
          <Text style={styles.title}>TREINOS</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('WorkoutForm', {})}
          style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
        >
          <Icon name="plus" size="sm" color={colors.white} />
        </Pressable>
      </View>

      {/* Tabs: Meus treinos | Modelos */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabPill, activeTab === 'my' && styles.tabPillActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            Meus treinos
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabPill, activeTab === 'templates' && styles.tabPillActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Modelos
          </Text>
        </Pressable>
      </View>

      {/* Muscle Filter Tags */}
      <View style={styles.tagsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsScroll}
        >
          {MUSCLE_TAGS.map((tag) => {
            const isSelected = selectedMuscle === tag;
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedMuscle(tag)}
                style={[styles.tagBadge, isSelected && styles.tagBadgeActive]}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Workout List */}
      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={displayedWorkouts}
          keyExtractor={(item) => item.id}
          style={styles.listScroll}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="dumbbell"
              title={activeTab === 'my' ? 'AINDA NÃO HÁ TREINOS' : 'NENHUM MODELO ENCONTRADO'}
              message={
                activeTab === 'my'
                  ? 'Crie sua primeira rotina ou use um dos nossos modelos prontos.'
                  : 'Nenhum treino disponível para este filtro.'
              }
              actionLabel={activeTab === 'my' ? 'Criar treino' : undefined}
              onAction={
                activeTab === 'my'
                  ? () => navigation.navigate('WorkoutForm', {})
                  : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <WorkoutCard
                workout={item}
                exercises={exercises}
                onPress={() => {
                  if (activeTab === 'my') {
                    navigation.navigate('WorkoutDetail', { workoutId: item.id });
                  } else {
                    importTemplate(item);
                  }
                }}
                onMenu={
                  activeTab === 'my'
                    ? () => setMenuFor(item.id)
                    : () => importTemplate(item)
                }
              />
            </View>
          )}
        />
      )}

      {/* Actions Menu */}
      <MenuSheet
        visible={menuFor !== null}
        title="Ações"
        onClose={() => setMenuFor(null)}
        actions={[
          {
            label: 'Editar',
            icon: 'pencil',
            onPress: () => {
              const id = menuFor;
              if (id) navigation.navigate('WorkoutForm', { workoutId: id });
            },
          },
          {
            label: 'Duplicar',
            icon: 'duplicate',
            onPress: duplicate,
          },
          {
            label: 'Renomear',
            icon: 'edit',
            onPress: openRename,
          },
          {
            label: 'Excluir',
            icon: 'trash',
            destructive: true,
            onPress: () => {
              setToDelete(menuFor);
            },
          },
        ]}
      />

      <RenameModal
        visible={renameFor !== null}
        initialName={workouts.find((w) => w.id === renameFor)?.name ?? ''}
        onCancel={() => setRenameFor(null)}
        onConfirm={async (name) => {
          if (renameFor && name.trim()) {
            await workoutService.renameWorkout(renameFor, name.trim());
            await reload();
          }
          setRenameFor(null);
        }}
      />

      <ConfirmationModal
        visible={toDelete !== null}
        title="Excluir treino?"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Screen>
  );
}

function RenameModal({
  visible,
  initialName,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  initialName: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  React.useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <Text style={[typography.subtitle, styles.sheetTitle]}>Renomear treino</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome do treino"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <View style={styles.modalActions}>
            <Button title="Cancelar" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button
              title="Salvar"
              onPress={() => onConfirm(name)}
              disabled={!name.trim()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0A0A0C',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#FF1E27',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  newButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FF1E27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  tabPillActive: {
    backgroundColor: '#FF1E27',
    borderColor: '#FF1E27',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  tagsContainer: {
    marginBottom: spacing.md,
  },
  tagsScroll: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  tagBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#242428',
  },
  tagBadgeActive: {
    backgroundColor: '#271012',
    borderColor: '#FF1E27',
  },
  tagText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#FF1E27',
  },
  list: {
    paddingBottom: 100,
  },
  listScroll: {
    flex: 1,
  },
  cardWrap: {
    marginBottom: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: '#242428',
    padding: spacing.lg,
  },
  sheetTitle: {
    marginBottom: spacing.lg,
    color: colors.white,
  },
  input: {
    backgroundColor: '#1C1C20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#2E2E34',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
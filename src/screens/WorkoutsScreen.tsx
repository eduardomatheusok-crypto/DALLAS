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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  EmptyState,
  LoadingState,
  Screen,
  ScreenHeader,
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

type Nav = StackNavigationProp<RootStackParamList>;

export default function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();
  const { workouts, loading, reload } = useWorkouts();
  const { exercises, reload: reloadExercises } = useExercises();

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

  const openRename = () => {
    if (!menuFor) return;
    setRenameFor(menuFor);
    setMenuFor(null);
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <ScreenHeader
        overline="Sua biblioteca"
        title="Treinos"
        right={
          <Pressable
            onPress={() => navigation.navigate('WorkoutForm', {})}
            style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
          >
            <Icon name="plus" size="sm" color={colors.white} />
          </Pressable>
        }
      />

      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          style={styles.listScroll}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="dumbbell"
              title="AINDA NÃO HÁ TREINOS"
              message="Crie sua primeira rotina e comece a acompanhar sua evolução."
              actionLabel="Criar treino"
              onAction={() => navigation.navigate('WorkoutForm', {})}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <WorkoutCard
                workout={item}
                exercises={exercises}
                onPress={() =>
                  navigation.navigate('WorkoutDetail', { workoutId: item.id })
                }
                onMenu={() => setMenuFor(item.id)}
              />
            </View>
          )}
        />
      )}

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
    backgroundColor: colors.background,
  },
  newButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  list: {
    paddingBottom: spacing.xxxl,
  },
  listScroll: {
    flex: 1,
  },
  cardWrap: {
    marginBottom: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: spacing.lg,
  },
  sheetTitle: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
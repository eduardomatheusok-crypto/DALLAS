import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Screen,
  ScreenHeader,
  EmptyState,
  LoadingState,
  Button,
  IconButton,
} from '../components/common';
import GroupCard from '../components/groups/GroupCard';
import { useGroups } from '../hooks';
import { groupService } from '../services';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

export default function CommunityScreen() {
  const navigation = useNavigation<Nav>();
  const { groups, loading, reload } = useGroups();
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      reload();
    }, [reload]),
  );

  const openCreate = () => navigation.navigate('GroupForm');

  const openCode = () => {
    setCode('');
    setError(null);
    setCodeOpen(true);
  };

  const joinByCode = async () => {
    if (!code.trim()) return;
    setJoining(true);
    setError(null);
    try {
      const group = await groupService.joinByCode(code.trim());
      setCodeOpen(false);
      setJoining(false);
      navigation.navigate('GroupDetail', { groupId: group.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Código inválido.');
      setJoining(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader
        overline="DALLAS"
        title="Comunidade"
        right={
          <View style={styles.headerActions}>
            <IconButton name="link" onPress={openCode} />
            <IconButton name="add" onPress={openCreate} />
          </View>
        }
      />

      {loading ? (
        <LoadingState label="Carregando seus grupos..." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="people"
          title="NENHUM GRUPO AINDA"
          message="Crie um grupo de treino com sua crew ou entre com o código de convite de um amigo."
          actionLabel="Criar meu grupo"
          onAction={openCreate}
        />
      ) : (
        groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
          />
        ))
      )}

      <View style={styles.hint}>
        <Icon name="information-circle-outline" size="sm" color={colors.textMuted} />
        <Text style={styles.hintText}>
          Dentro do grupo você acompanha competições, ranking de evolução e o chat privado.
        </Text>
      </View>

      <Modal visible={codeOpen} transparent animationType="fade" onRequestClose={() => setCodeOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCodeOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.modal} onPress={() => {}}>
              <Text style={[typography.overline, styles.modalOverline]}>ENTRAR NO GRUPO</Text>
              <Text style={[typography.subtitle, styles.modalTitle]}>Código de convite</Text>
              <TextInput
                value={code}
                onChangeText={(v) => {
                  setCode(v.toUpperCase());
                  setError(null);
                }}
                placeholder="ABC123"
                placeholderTextColor={colors.textMuted}
                style={styles.codeInput}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                autoFocus
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                title="Entrar"
                onPress={joinByCode}
                loading={joining}
                disabled={!code.trim()}
              />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalOverline: {
    color: colors.primary,
  },
  modalTitle: {
    textTransform: 'none',
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.text,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
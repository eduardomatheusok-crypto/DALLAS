import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Screen, ScreenHeader, Button, Section } from '../components/common';
import { groupService } from '../services';
import { colors, spacing, typography, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const GROUP_ICONS = ['🏋️', '🔥', '💪', '👑', '🏆', '⚡', '🥇', '🛡️', '🚀', '🎯', '💥', '🤝', '💀', '🦍'];

export default function GroupFormScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(GROUP_ICONS[0]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Nome obrigatório', 'Dê um nome para o grupo.');
      return;
    }
    setSaving(true);
    try {
      const group = await groupService.create(trimmed, description.trim(), icon);
      navigation.replace('GroupDetail', { groupId: group.id });
    } catch (e) {
      setSaving(false);
      Alert.alert('Não foi possível criar', e instanceof Error ? e.message : 'Erro inesperado.');
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader overline="Comunidade" title="Novo grupo" />

      <Section title="Nome do grupo">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Time Feroz"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          maxLength={80}
          autoFocus
        />
      </Section>

      <Section title="Descrição (opcional)">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Quem treina junto evolui junto"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.multiline]}
          maxLength={300}
          multiline
        />
      </Section>

      <Section title="Ícone do grupo">
        <View style={styles.iconGrid}>
          {GROUP_ICONS.map((emoji) => {
            const active = emoji === icon;
            return (
              <Pressable
                key={emoji}
                onPress={() => setIcon(emoji)}
                style={[styles.iconCell, active && styles.iconCellActive]}
              >
                <Text style={styles.iconEmoji}>{emoji}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Button title="Criar grupo" onPress={save} loading={saving} disabled={!name.trim()} icon="checkmark" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.text,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconCell: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCellActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  iconEmoji: {
    fontSize: 22,
  },
});
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Screen, ScreenHeader, Button, Section, Stepper } from '../components/common';
import { competitionService } from '../services';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (
    d.getFullYear() !== Number(m[1]) ||
    d.getMonth() !== Number(m[2]) - 1 ||
    d.getDate() !== Number(m[3])
  ) {
    return null;
  }
  return d;
}

const END_PRESETS = [7, 14, 30, 60];

export default function CompetitionFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<{ key: string; name: string; params: { groupId: string } }>();
  const { groupId } = route.params;

  const today = useMemo(() => new Date(), []);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startValue, setStartValue] = useState(toISODate(today));
  const [endValue, setEndValue] = useState(toISODate(addDays(today, 14)));
  const [awarded, setAwarded] = useState(0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Nome obrigatório', 'Dê um nome para a competição.');
      return;
    }
    const start = parseDate(startValue);
    const end = parseDate(endValue);
    if (!start || !end) {
      Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD.');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      Alert.alert('Datas inválidas', 'O término deve ser depois do início.');
      return;
    }
    setSaving(true);
    try {
      await competitionService.create(groupId, {
        name: trimmed,
        description: description.trim() || undefined,
        startsAt: `${toISODate(start)}T12:00:00.000Z`,
        endsAt: `${toISODate(end)}T12:00:00.000Z`,
        awardedPositions: awarded,
      });
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Não foi possível criar', e instanceof Error ? e.message : 'Erro inesperado.');
    }
  };

  const applyPreset = (days: number) => {
    const start = parseDate(startValue) ?? today;
    setEndValue(toISODate(addDays(start, days)));
  };

  return (
    <Screen scroll>
      <ScreenHeader overline="Comunidade" title="Nova competição" />

      <Section title="Nome">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Desafio Força"
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
          placeholder="Quem evoluir mais até o fim?"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.multiline]}
          maxLength={400}
          multiline
        />
      </Section>

      <Section
        title="Período"
        right={
          <View style={styles.presets}>
            {END_PRESETS.map((days) => (
              <Pressable key={days} onPress={() => applyPreset(days)} style={styles.preset}>
                <Text style={styles.presetText}>{days}d</Text>
              </Pressable>
            ))}
          </View>
        }
      >
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Início</Text>
            <TextInput
              value={startValue}
              onChangeText={setStartValue}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.dateInput]}
              autoCorrect={false}
              maxLength={10}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Término</Text>
            <TextInput
              value={endValue}
              onChangeText={setEndValue}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.dateInput]}
              autoCorrect={false}
              maxLength={10}
            />
          </View>
        </View>
      </Section>

      <Section title="Posições destacadas">
        <View style={styles.stepperRow}>
          <Stepper value={awarded} onChange={setAwarded} min={0} max={10} />
          <View style={styles.stepperHint}>
            <Text style={styles.stepperHintText}>
              {awarded === 0 ? 'Automático (conforme nº de participantes)' : `${awarded} ${awarded === 1 ? 'posição' : 'posições'} premiadas`}
            </Text>
          </View>
        </View>
      </Section>

      <View style={styles.scoreCard}>
        <View style={styles.scoreTitle}>
          <Icon name="trophy" size="sm" color={colors.primary} />
          <Text style={[typography.overline, { color: colors.primary }]}>COMO PONTUA</Text>
        </View>
        <Text style={styles.scoreText}>
          40% progressão · 30% consistência · 20% volume · 10% metas
        </Text>
        <Text style={styles.scoreSub}>
          Progressão compara seu melhor peso na janela com os 30 dias anteriores. Quem mais
          evoluir leva o topo.
        </Text>
      </View>

      <Button title="Criar competição" onPress={save} loading={saving} disabled={!name.trim()} icon="checkmark" />
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
  presets: {
    flexDirection: 'row',
    gap: 6,
  },
  preset: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  presetText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
    gap: 6,
  },
  dateLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateInput: {
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperHint: {
    flex: 1,
  },
  stepperHintText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  scoreTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  scoreSub: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
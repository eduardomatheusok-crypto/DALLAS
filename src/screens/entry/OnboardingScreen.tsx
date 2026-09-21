import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, spacing, borderRadius } from '../../theme';
import { Icon } from '../../theme/icons';
import { userService, trainingPreferencesService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import {
  TRAINING_FREQUENCIES,
  TRAINING_GOALS,
  WEEK_DAYS,
} from '../../models';
import type {
  TrainingFrequency,
  TrainingGoal,
  UserTrainingPreferences,
  WeekDay,
} from '../../models';

interface Props {
  onExit: () => void;
}

const STEPS = [
  {
    title: 'Quantos dias você pode e quer treinar?',
    subtitle: 'Sua frequência mínima por semana.',
  },
  {
    title: 'Escolha os dias que deseja treinar',
    subtitle: 'Toque para selecionar — você pode ajustar antes de continuar.',
  },
  {
    title: 'O que você busca?',
    subtitle: 'Seu objetivo principal. Dá para mudar depois.',
  },
  {
    title: 'Crie sua conta',
    subtitle: 'Você entra com o mesmo nome de usuário e senha.',
  },
] as const;

const TOTAL_STEPS = STEPS.length;

function StepTransition({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) reduceMotion.current = value;
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion.current) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    opacity.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [step, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
  );
}

export default function OnboardingScreen({ onExit }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const auth = useAuth();

  const [step, setStep] = useState(0);
  const [frequency, setFrequency] = useState<TrainingFrequency | null>(null);
  const [days, setDays] = useState<WeekDay[]>([]);
  const [goal, setGoal] = useState<TrainingGoal | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleDay = (day: WeekDay) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const canContinue =
    step === 0
      ? frequency !== null
      : step === 1
        ? days.length > 0
        : step === 2
          ? goal !== null
          : true;

  const submit = async () => {
    if (!username.trim() || password.length < 4) {
      setError('Informe um nome de usuário e uma senha com pelo menos 4 caracteres.');
      return;
    }
    if (!frequency || !goal) {
      setError('Preencha todas as etapas antes de concluir.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const user = await userService.register(username.trim(), password);
      const prefs: UserTrainingPreferences = {
        userId: user.id,
        frequency,
        trainingDays: days,
        goal,
        updatedAt: new Date().toISOString(),
      };
      await trainingPreferencesService.save(prefs);
      await auth.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar sua conta.');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    setError(null);
    if (step === 0 && !frequency) {
      setError('Escolha uma frequência para continuar.');
      return;
    }
    if (step === 1 && days.length === 0) {
      setError('Selecione ao menos um dia de treino.');
      return;
    }
    if (step === 2 && !goal) {
      setError('Escolha o seu objetivo para continuar.');
      return;
    }
    if (step === TOTAL_STEPS - 1) {
      submit();
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setError(null);
    if (step === 0) {
      onExit();
      return;
    }
    setStep((s) => s - 1);
  };

  const current = STEPS[step];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.md, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={goBack}
            hitSlop={8}
            accessibilityLabel="Voltar"
            style={({ pressed }) => [styles.backButton, { borderColor: colors.border }, pressed && styles.pressed]}
          >
            <Icon name="chevronLeft" size="sm" color={colors.text} />
          </Pressable>
          <View style={styles.progressWrap}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {step + 1}/{TOTAL_STEPS}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceLight }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepTransition key={step} step={step}>
          <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {current.subtitle}
          </Text>

          <View style={styles.options}>
            {step === 0 &&
              TRAINING_FREQUENCIES.map((option) => (
                <SelectChip
                  key={option.value}
                  label={option.label}
                  selected={frequency === option.value}
                  onPress={() => setFrequency(option.value)}
                  colors={colors}
                />
              ))}

            {step === 1 && (
              <View style={styles.dayGrid}>
                {WEEK_DAYS.map((day) => (
                  <DayChip
                    key={day.value}
                    label={day.label}
                    selected={days.includes(day.value)}
                    onPress={() => toggleDay(day.value)}
                    colors={colors}
                  />
                ))}
              </View>
            )}

            {step === 2 &&
              TRAINING_GOALS.map((option) => (
                <SelectChip
                  key={option.value}
                  label={option.label}
                  selected={goal === option.value}
                  onPress={() => setGoal(option.value)}
                  colors={colors}
                />
              ))}

            {step === 3 && (
              <View style={styles.form}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Nome de usuário</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ex.: atleta"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                />
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Senha</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  editable={!submitting}
                />
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Sua conta fica vinculada a este dispositivo.
                </Text>
              </View>
            )}
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        </StepTransition>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          disabled={submitting || (step < TOTAL_STEPS - 1 && !canContinue)}
          style={({ pressed }) => [
            styles.continueButton,
            { backgroundColor: colors.primary },
            (submitting || (step < TOTAL_STEPS - 1 && !canContinue)) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.continueText}>
            {step === TOTAL_STEPS - 1 ? 'CONCLUIR' : 'CONTINUAR'}
          </Text>
          {submitting ? <ActivityIndicator color={colors.white} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

interface ChipColors {
  text: string;
  textSecondary: string;
  border: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  scrim: string;
  white: string;
}

function SelectChip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ChipColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.selectChip,
        { borderColor: selected ? colors.primary : colors.border },
        selected && styles.selectChipSelected,
        selected && { backgroundColor: colors.scrim },
        pressed && styles.pressed,
      ]}
    >
      {selected ? (
        <View style={[styles.radio, { borderColor: colors.primary, backgroundColor: colors.primary }]}>
          <Icon name="check" size="xs" color={colors.white} />
        </View>
      ) : (
        <View style={[styles.radio, { borderColor: colors.border }]} />
      )}
      <Text
        style={[
          styles.selectLabel,
          { color: selected ? colors.text : colors.textSecondary },
          selected && { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DayChip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ChipColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.dayChip,
        { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.dayLabel,
          { color: selected ? colors.white : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    flex: 1,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  options: {
    gap: spacing.md,
    marginTop: spacing.xxxl,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  selectChipSelected: {
    borderWidth: 1.5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayChip: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.82,
  },
});
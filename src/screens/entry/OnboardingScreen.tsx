import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../theme';
import { Icon } from '../../theme/icons';
import { UserAvatar, PRESET_AVATARS } from '../../components/common';
import {
  userService,
  trainingPreferencesService,
  workoutPlanGeneratorService,
  type GeneratedPlanResult,
} from '../../services';
import { useAuth } from '../../auth/AuthContext';
import {
  TRAINING_GOALS,
  TRAINING_EXPERIENCES,
  EXACT_FREQUENCIES,
  WEEK_DAYS,
  TRAINING_LOCATIONS,
  TRAINING_PREFERENCES,
  TRAINING_SPLITS,
  type TrainingGoal,
  type TrainingExperience,
  type ExactFrequency,
  type WeekDay,
  type TrainingLocation,
  type TrainingPreference,
  type UserTrainingPreferences,
} from '../../models/UserTrainingPreferences';

const logoImg = require('../../../assets/images/dallas-icon-trans.png');

interface Props {
  onExit: () => void;
}

type OnboardingPhase =
  | 'questions'
  | 'account'
  | 'preparing'
  | 'ready';

export default function OnboardingScreen({ onExit }: Props) {
  const insets = useSafeAreaInsets();
  const auth = useAuth();

  // Phase & Steps (0 to 5)
  const [phase, setPhase] = useState<OnboardingPhase>('questions');
  const [step, setStep] = useState(0);

  // Form State
  const [goal, setGoal] = useState<TrainingGoal | null>('gain-mass');
  const [experience, setExperience] = useState<TrainingExperience | null>('intermediate');
  const [exactFrequency, setExactFrequency] = useState<ExactFrequency>(4);
  const [trainingDays, setTrainingDays] = useState<WeekDay[]>(['monday', 'tuesday', 'thursday', 'friday']);
  const [location, setLocation] = useState<TrainingLocation | null>('gym');
  const [preference, setPreference] = useState<TrainingPreference | null>('auto');

  // Account State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>('asset:dallas_base');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Prepared Plan State
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlanResult | null>(null);

  // Preparation Step Animation Checks
  const [prepStep1, setPrepStep1] = useState(false);
  const [prepStep2, setPrepStep2] = useState(false);
  const [prepStep3, setPrepStep3] = useState(false);

  const toggleDay = (day: WeekDay) => {
    Haptics.selectionAsync().catch(() => {});
    setTrainingDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      }
      if (prev.length >= exactFrequency) {
        // Substitui o primeiro ou limita à frequência
        return [...prev.slice(1), day];
      }
      return [...prev, day];
    });
  };

  const handleNextQuestion = () => {
    Haptics.selectionAsync().catch(() => {});
    setError(null);

    if (step === 2) {
      // Ajusta os dias selecionados para casar com a frequência caso necessário
      if (trainingDays.length !== exactFrequency) {
        const defaultDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        setTrainingDays(defaultDays.slice(0, exactFrequency));
      }
    }

    if (step === 3 && trainingDays.length !== exactFrequency) {
      setError(`Selecione exatamente ${exactFrequency} dias de treino.`);
      return;
    }

    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      setPhase('account');
    }
  };

  const handleBack = () => {
    setError(null);
    if (phase === 'account') {
      setPhase('questions');
      setStep(5);
      return;
    }
    if (step === 0) {
      onExit();
      return;
    }
    setStep((s) => s - 1);
  };

  const handleCreateAccountAndPlan = async () => {
    if (!username.trim() || password.length < 4) {
      setError('Informe um nome de usuário e uma senha de no mínimo 4 caracteres.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      // 1. Cria a conta no backend/storage
      const user = await userService.register(username.trim(), password, avatarUrl || undefined);

      // 2. Transiciona para a animação "Preparando seu DALLAS"
      setPhase('preparing');

      // 3. Monta preferências e gera treinos
      const prefs: UserTrainingPreferences = {
        userId: user.id,
        goal: goal || 'gain-mass',
        experience: experience || 'intermediate',
        exactFrequency,
        trainingDays,
        location: location || 'gym',
        preference: preference || 'auto',
        assignedTemplateId: preference && preference !== 'auto' ? preference : undefined,
        onboardingCompleted: false,
        updatedAt: new Date().toISOString(),
      };

      const plan = workoutPlanGeneratorService.generatePlan(prefs);
      prefs.assignedTemplateId = plan.templateId;
      setGeneratedPlan(plan);

      // Sequência animada dos checks
      setTimeout(() => setPrepStep1(true), 600);
      setTimeout(() => setPrepStep2(true), 1300);
      setTimeout(async () => {
        setPrepStep3(true);
        // Salva os treinos gerados e as preferências
        await workoutPlanGeneratorService.savePlanWorkouts(plan.workouts);
        prefs.onboardingCompleted = true;
        await trainingPreferencesService.save(prefs);

        // Transiciona para a tela de pronto
        setTimeout(() => {
          setPhase('ready');
        }, 800);
      }, 2000);
    } catch (e) {
      setPhase('account');
      setError(e instanceof Error ? e.message : 'Erro ao criar conta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishOnboarding = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await auth.refresh();
  };

  // ==================== FASE 1: PERGUNTAS ====================
  if (phase === 'questions') {
    const titles = [
      'Qual é o seu objetivo?',
      'Qual seu nível de experiência?',
      'Quantos dias você quer treinar?',
      'Escolha seus dias de treino',
      'Onde você vai treinar?',
      'Como prefere organizar seu treino?',
    ];

    const subtitles = [
      'Seu foco guiará as faixas de repetições e volume.',
      'Adaptaremos a intensidade e recuperação.',
      'Defina sua rotina semanal de musculação.',
      `Selecione ${exactFrequency} dias. Os demais serão descanso.`,
      'Configuraremos os exercícios com base no seu espaço.',
      'Sua escolha determinística ideal de divisão.',
    ];

    return (
      <View style={styles.root}>
        {/* Progress Bar & Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
            <Icon name="chevronLeft" size="sm" color={colors.white} />
          </Pressable>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((step + 1) / 6) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.stepCounter}>{step + 1} de 6</Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.questionTitle}>{titles[step]}</Text>
          <Text style={styles.questionSubtitle}>{subtitles[step]}</Text>

          {/* PERGUNTA 1: OBJETIVO */}
          {step === 0 && (
            <View style={styles.cardsList}>
              {TRAINING_GOALS.map((opt) => {
                const selected = goal === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.selectCard, selected && styles.selectCardActive]}
                    onPress={() => setGoal(opt.value)}
                  >
                    <View style={styles.cardTextWrap}>
                      <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                        {opt.label}
                      </Text>
                      {opt.description ? (
                        <Text style={styles.cardDesc}>{opt.description}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* PERGUNTA 2: EXPERIÊNCIA */}
          {step === 1 && (
            <View style={styles.cardsList}>
              {TRAINING_EXPERIENCES.map((opt) => {
                const selected = experience === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.selectCard, selected && styles.selectCardActive]}
                    onPress={() => setExperience(opt.value)}
                  >
                    <View style={styles.cardTextWrap}>
                      <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                        {opt.label}
                      </Text>
                      {opt.description ? (
                        <Text style={styles.cardDesc}>{opt.description}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* PERGUNTA 3: FREQUÊNCIA */}
          {step === 2 && (
            <View style={styles.cardsList}>
              {EXACT_FREQUENCIES.map((opt) => {
                const selected = exactFrequency === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.selectCard, selected && styles.selectCardActive]}
                    onPress={() => setExactFrequency(opt.value)}
                  >
                    <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                      {opt.label}
                    </Text>
                    <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* PERGUNTA 4: DIAS DA SEMANA */}
          {step === 3 && (
            <View style={styles.daysSection}>
              <View style={styles.streakNoticeBox}>
                <Icon name="flame" size="sm" color="#FF1E27" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.streakNoticeTitle}>
                    Sua sequência respeitará sua rotina.
                  </Text>
                  <Text style={styles.streakNoticeSubtitle}>
                    Dias não selecionados são descanso planejado e NÃO quebram sua sequência!
                  </Text>
                </View>
              </View>

              <View style={styles.daysCounterRow}>
                <View
                  style={[
                    styles.counterBadge,
                    trainingDays.length === exactFrequency
                      ? styles.counterBadgeSuccess
                      : styles.counterBadgePending,
                  ]}
                >
                  <Text style={styles.counterBadgeText}>
                    {trainingDays.length} de {exactFrequency} dias selecionados
                  </Text>
                </View>
              </View>

              <View style={styles.daysGrid}>
                {WEEK_DAYS.map((opt) => {
                  const selected = trainingDays.includes(opt.value);
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.dayCard, selected && styles.dayCardActive]}
                      onPress={() => toggleDay(opt.value)}
                    >
                      <Text style={[styles.dayShort, selected && styles.dayShortActive]}>
                        {opt.shortLabel}
                      </Text>
                      <Text style={[styles.dayFull, selected && styles.dayFullActive]}>
                        {opt.label}
                      </Text>
                      {selected ? (
                        <View style={styles.dayCheck}>
                          <Icon name="check" size={12} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* PERGUNTA 5: LOCAL */}
          {step === 4 && (
            <View style={styles.cardsList}>
              {TRAINING_LOCATIONS.map((opt) => {
                const selected = location === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.selectCard, selected && styles.selectCardActive]}
                    onPress={() => setLocation(opt.value)}
                  >
                    <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                      {opt.label}
                    </Text>
                    <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* PERGUNTA 6: ORGANIZAÇÃO DA DIVISÃO (FILTRADA POR FREQUÊNCIA) */}
          {step === 5 && (
            <View style={styles.cardsList}>
              {TRAINING_SPLITS.filter(
                (s) => s.id === 'auto' || s.frequencies.includes(exactFrequency),
              ).map((split) => {
                const selected = (preference || 'auto') === split.id;
                return (
                  <Pressable
                    key={split.id}
                    style={[styles.selectCard, selected && styles.selectCardActive]}
                    onPress={() => setPreference(split.id)}
                  >
                    <View style={styles.cardTextWrap}>
                      <View style={styles.prefTitleRow}>
                        <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                          {split.name}
                        </Text>
                        {split.recommended ? (
                          <View style={styles.badgeWrap}>
                            <Text style={styles.badgeText}>Recomendado</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.cardDesc}>{split.description}</Text>
                    </View>
                    <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
          <Pressable
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
            onPress={handleNextQuestion}
          >
            <Text style={styles.continueBtnText}>CONTINUAR</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ==================== FASE 2: CONTA ====================
  if (phase === 'account') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
            <Icon name="chevronLeft" size="sm" color={colors.white} />
          </Pressable>
          <Text style={styles.accountHeaderTitle}>CRIE SUA CONTA</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.accountBrand}>
            <Image source={logoImg} style={styles.smallLogo} resizeMode="contain" />
            <Text style={styles.accountHeading}>Pronto para começar?</Text>
            <Text style={styles.accountSub}>
              Crie seu acesso para registrar seus treinos, acompanhar cargas e salvar sua evolução.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            {/* Foto de Perfil */}
            <View style={styles.avatarPickerSection}>
              <Text style={styles.fieldLabel}>FOTO DE PERFIL</Text>
              <View style={styles.avatarMainRow}>
                <View style={styles.avatarPreviewWrap}>
                  <UserAvatar
                    avatarUrl={avatarUrl}
                    name={username || 'D'}
                    size={72}
                    showBorder
                    borderColor="#FF1E27"
                  />
                  <View style={styles.avatarBadge}>
                    <Icon name="check" size="xs" color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.avatarRightCol}>
                  <Text style={styles.avatarHint}>
                    Escolha um avatar oficial ou use seu link:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.avatarPresetsScroll}
                  >
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = avatarUrl === preset.uri;
                      return (
                        <Pressable
                          key={preset.id}
                          style={[
                            styles.avatarPresetItem,
                            isSelected && styles.avatarPresetItemSelected,
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setAvatarUrl(preset.uri);
                            setShowCustomInput(false);
                          }}
                        >
                          <UserAvatar
                            avatarUrl={preset.uri}
                            size={40}
                            showBorder={isSelected}
                            borderColor="#FF1E27"
                          />
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Pressable
                    style={styles.customLinkToggle}
                    onPress={() => setShowCustomInput((v) => !v)}
                  >
                    <Icon name="link" size="xs" color="#8E8E93" />
                    <Text style={styles.customLinkToggleText}>
                      {showCustomInput ? 'Fechar link' : 'Usar link de foto web'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {showCustomInput ? (
                <View style={styles.customUrlInputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    placeholderTextColor="#636366"
                    value={customAvatarInput}
                    onChangeText={(t) => {
                      setCustomAvatarInput(t);
                      if (t.trim().startsWith('http')) {
                        setAvatarUrl(t.trim());
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NOME DE USUÁRIO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: eduardofit"
                placeholderTextColor="#636366"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>SENHA</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 4 caracteres"
                placeholderTextColor="#636366"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError(null);
                }}
                secureTextEntry
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.continueBtn,
                submitting && { opacity: 0.6 },
                pressed && styles.pressed,
              ]}
              onPress={handleCreateAccountAndPlan}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueBtnText}>CRIAR MEU DALLAS</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ==================== FASE 3: PREPARANDO ====================
  if (phase === 'preparing') {
    return (
      <View style={[styles.root, styles.centerEverything]}>
        <View style={styles.prepContent}>
          <Image source={logoImg} style={styles.prepLogo} resizeMode="contain" />

          <Text style={styles.prepTitle}>PREPARANDO SEU DALLAS...</Text>

          <View style={styles.prepSteps}>
            <View style={styles.prepStepRow}>
              <View style={[styles.checkCircle, prepStep1 && styles.checkCircleActive]}>
                <Icon name="check" size={14} color={prepStep1 ? '#FFFFFF' : '#3F3F46'} />
              </View>
              <Text style={[styles.prepStepText, prepStep1 && styles.prepStepTextActive]}>
                Configurando sua rotina
              </Text>
            </View>

            <View style={styles.prepStepRow}>
              <View style={[styles.checkCircle, prepStep2 && styles.checkCircleActive]}>
                <Icon name="check" size={14} color={prepStep2 ? '#FFFFFF' : '#3F3F46'} />
              </View>
              <Text style={[styles.prepStepText, prepStep2 && styles.prepStepTextActive]}>
                Organizando sua semana
              </Text>
            </View>

            <View style={styles.prepStepRow}>
              <View style={[styles.checkCircle, prepStep3 && styles.checkCircleActive]}>
                <Icon name="check" size={14} color={prepStep3 ? '#FFFFFF' : '#3F3F46'} />
              </View>
              <Text style={[styles.prepStepText, prepStep3 && styles.prepStepTextActive]}>
                Preparando seus treinos
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ==================== FASE 4: SEU DALLAS ESTÁ PRONTO ====================
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.readyContent,
          { paddingTop: insets.top + 40, paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image source={logoImg} style={styles.readyLogo} resizeMode="contain" />

        <Text style={styles.readyHeading}>SEU DALLAS ESTÁ PRONTO.</Text>
        <Text style={styles.readySubtitle}>
          {generatedPlan?.templateTitle} • {generatedPlan?.subtitle}
        </Text>

        {/* Schedule Grid */}
        <View style={styles.readyScheduleBox}>
          <Text style={styles.scheduleTitle}>SUA GRADE SEMANAL</Text>
          <View style={styles.scheduleGrid}>
            {generatedPlan?.schedule.map((item) => (
              <View key={item.day} style={styles.scheduleItem}>
                <Text style={styles.schedDay}>{item.shortLabel}</Text>
                <Text style={styles.schedWorkout} numberOfLines={1}>
                  {item.workoutName}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Streak highlight message */}
        <View style={styles.streakHighlight}>
          <Icon name="flame" size="sm" color="#FF1E27" />
          <Text style={styles.streakHighlightText}>
            Sua sequência acompanhará seus dias de treino.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && styles.pressed]}
          onPress={handleFinishOnboarding}
        >
          <Text style={styles.startBtnText}>COMEÇAR NO DALLAS</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242428',
  },
  progressWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#202024',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF1E27',
  },
  stepCounter: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  questionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  cardsList: {
    gap: spacing.sm,
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.lg,
  },
  selectCardActive: {
    backgroundColor: '#1C1012',
    borderColor: '#FF1E27',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E4E4E7',
  },
  cardTitleActive: {
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 3,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  radioCircleActive: {
    borderColor: '#FF1E27',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF1E27',
  },
  prefTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeWrap: {
    backgroundColor: 'rgba(255, 30, 39, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FF1E27',
    fontSize: 10,
    fontWeight: '700',
  },
  daysSection: {
    gap: spacing.md,
  },
  streakNoticeBox: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 30, 39, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.25)',
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  streakNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  streakNoticeSubtitle: {
    fontSize: 11,
    color: '#A1A1AA',
    lineHeight: 15,
  },
  daysCounterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  counterBadgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  counterBadgePending: {
    backgroundColor: 'rgba(255, 30, 39, 0.12)',
    borderColor: 'rgba(255, 30, 39, 0.35)',
  },
  counterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysGrid: {
    gap: spacing.xs,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242428',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  dayCardActive: {
    backgroundColor: '#1C1012',
    borderColor: '#FF1E27',
  },
  dayShort: {
    fontSize: 13,
    fontWeight: '800',
    color: '#71717A',
    width: 38,
  },
  dayShortActive: {
    color: '#FF1E27',
  },
  dayFull: {
    flex: 1,
    fontSize: 14,
    color: '#E4E4E7',
    fontWeight: '600',
  },
  dayFullActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF1E27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: '#0A0A0C',
  },
  continueBtn: {
    backgroundColor: '#FF1E27',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 30, 39, 0.1)',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.3)',
  },
  errorText: {
    color: '#FF1E27',
    fontSize: 13,
    fontWeight: '600',
  },
  accountHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  accountBrand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  smallLogo: {
    width: 56,
    height: 56,
    marginBottom: spacing.md,
  },
  accountHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  accountSub: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  formSection: {
    gap: spacing.lg,
  },
  avatarPickerSection: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222226',
    gap: 12,
  },
  avatarMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarPreviewWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF1E27',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#070709',
  },
  avatarRightCol: {
    flex: 1,
    gap: 6,
  },
  avatarHint: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  avatarPresetsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  avatarPresetItem: {
    borderRadius: 22,
    padding: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarPresetItemSelected: {
    borderColor: '#FF1E27',
  },
  customLinkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  customLinkToggleText: {
    fontSize: 11,
    color: '#FF1E27',
    fontWeight: '600',
  },
  customUrlInputWrap: {
    marginTop: 4,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#141416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242428',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  centerEverything: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepContent: {
    alignItems: 'center',
    width: '85%',
  },
  prepLogo: {
    width: 80,
    height: 80,
    marginBottom: spacing.xl,
  },
  prepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: spacing.xxl,
  },
  prepSteps: {
    width: '100%',
    gap: spacing.lg,
  },
  prepStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1C1C20',
    borderWidth: 1,
    borderColor: '#2E2E34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#FF1E27',
    borderColor: '#FF1E27',
  },
  prepStepText: {
    fontSize: 14,
    color: '#71717A',
    fontWeight: '600',
  },
  prepStepTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  readyContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  readyLogo: {
    width: 70,
    height: 70,
    marginBottom: spacing.md,
  },
  readyHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  readySubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF1E27',
    letterSpacing: 1.2,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  readyScheduleBox: {
    width: '100%',
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scheduleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  scheduleGrid: {
    gap: spacing.sm,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: spacing.md,
  },
  schedDay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF1E27',
    width: 36,
  },
  schedWorkout: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  streakHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 30, 39, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: spacing.xl,
  },
  streakHighlightText: {
    fontSize: 12,
    color: '#E4E4E7',
    fontWeight: '600',
    flex: 1,
  },
  startBtn: {
    width: '100%',
    backgroundColor: '#FF1E27',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
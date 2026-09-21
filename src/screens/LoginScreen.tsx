import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, spacing, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import { userService } from '../services';
import { useAuth } from '../auth/AuthContext';
import { entryContent } from '../entry/entryContent';

interface Props {
  onBack: () => void;
  onCreateAccount: () => void;
}

/**
 * Tela de login do DALLAS (visual reformulado, mesma lógica de autenticação).
 * Criar conta agora acontece no onboarding — aqui fica só o acesso.
 */
export default function LoginScreen({ onBack, onCreateAccount }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!username.trim() || password.length < 4) {
      setError('Informe nome de usuário e senha (mínimo 4 caracteres).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await userService.login(username.trim(), password);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível acessar sua conta.');
    } finally {
      setLoading(false);
    }
  };

  const { login } = entryContent;

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
            onPress={onBack}
            hitSlop={8}
            accessibilityLabel="Voltar"
            style={({ pressed }) => [styles.backButton, { borderColor: colors.border }, pressed && styles.pressed]}
          >
            <Icon name="chevronLeft" size="sm" color={colors.text} />
          </Pressable>
          <Text style={[styles.brand, { color: colors.primary }]}>DALLAS</Text>
        </View>
      </View>

      {/* Form */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text style={[styles.title, { color: colors.text }]}>{login.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {login.subtitle}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Nome de usuário</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            value={username}
            onChangeText={setUsername}
            placeholder={login.usernamePlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Senha</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder={login.passwordPlaceholder}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            editable={!loading}
          />

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <Pressable
            onPress={submit}
            accessibilityRole="button"
            disabled={loading}
            style={({ pressed }) => [
              styles.enterButton,
              { backgroundColor: colors.primary },
              loading && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.enterText}>ENTRAR</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onCreateAccount}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.createButton,
              { borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.createText, { color: colors.text }]}>CRIAR CONTA</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
  brand: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxxl,
    flexGrow: 1,
  },
  intro: {
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
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
    height: 50,
    fontSize: 15,
  },
  error: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  enterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
  },
  enterText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  createText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
});
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { colors, spacing, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import { userService } from '../services';
import { useAuth } from '../auth/AuthContext';

const logoImg = require('../../assets/images/dallas-icon-trans.png');

interface Props {
  onBack: () => void;
  onCreateAccount: () => void;
}

export default function LoginScreen({ onBack, onCreateAccount }: Props) {
  const insets = useSafeAreaInsets();
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Icon name="chevronLeft" size="sm" color={colors.white} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Section */}
        <View style={styles.brandBox}>
          <View style={styles.logoContainer}>
            <View style={styles.radialGlow} />
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandTitle}>DALLAS</Text>
          <Text style={styles.screenHeading}>Acessar sua conta</Text>
          <Text style={styles.screenSubtitle}>
            Continue seu progresso e mantenha sua disciplina.
          </Text>
        </View>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert" size="xs" color="#FF1E27" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>NOME DE USUÁRIO</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu usuário"
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
            <Text style={styles.label}>SENHA</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#636366"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError(null);
              }}
              secureTextEntry
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              loading && styles.submitBtnDisabled,
              pressed && styles.pressed,
            ]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>ENTRAR</Text>
            )}
          </Pressable>
        </View>

        {/* Switch to Register */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Ainda não tem conta?</Text>
          <Pressable onPress={onCreateAccount} hitSlop={8}>
            <Text style={styles.registerLink}>Criar conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070709',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121215',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242428',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  radialGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 30, 39, 0.22)',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 8,
  },
  logo: {
    width: 64,
    height: 64,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 12,
  },
  screenHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 30, 39, 0.1)',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.3)',
    marginBottom: spacing.lg,
  },
  errorText: {
    flex: 1,
    color: '#FF1E27',
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242428',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#FF1E27',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF1E27',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
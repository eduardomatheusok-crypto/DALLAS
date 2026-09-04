import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card } from '../components/common';
import Screen from '../components/common/Screen';
import { userService } from '../services';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../theme/icons';

export default function LoginScreen() {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!username.trim() || password.length < 4) {
      setError('Informe nome e senha (mínimo 4 caracteres).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await userService.login(username.trim(), password);
      } else {
        await userService.register(username.trim(), password);
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Não foi possível acessar sua conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Icon name="dumbbell" size={30} color={colors.primary} />
          </View>
          <Text style={[typography.overline, styles.brandTag]}>DALLAS</Text>
          <Text style={styles.brandTitle}>Sua força começa aqui</Text>
          <Text style={styles.brandSub}>
            Entre para continuar sua evolução, sequência e treinos.
          </Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.tabs}>
            <Pressable
              onPress={() => { setMode('login'); setError(null); }}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Entrar</Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode('register'); setError(null); }}
              style={[styles.tab, mode === 'register' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Criar conta</Text>
            </Pressable>
          </View>

          <Text style={[typography.label, styles.fieldLabel]}>Nome de usuário</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="ex.: atleta"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={[typography.label, styles.fieldLabel]}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={mode === 'login' ? 'Entrar' : 'Criar conta'}
            onPress={submit}
            loading={loading}
            disabled={loading}
            icon="checkmarkDone"
          />
        </Card>

        {mode === 'register' ? (
          <Text style={styles.hint}>
            Sua conta fica vinculada a este dispositivo. Você entra com o mesmo nome e senha.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandTag: {
    color: colors.primary,
    letterSpacing: 3,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  brandSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  formCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.white,
  },
  fieldLabel: {
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
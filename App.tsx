import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React, { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import EntryFlow from './src/screens/entry/EntryFlow';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { ThemeProvider, useAppTheme } from './src/theme';
import { LoadingState } from './src/components/common';
import Screen from './src/components/common/Screen';
import { refreshApiStatus } from './src/api';

function Root() {
  const { authed, checking } = useAuth();

  if (checking) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!authed) {
    return <EntryFlow />;
  }

  return <RootNavigator />;
}

function AppContent() {
  const { isDark, colors } = useAppTheme();

  const theme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [isDark, colors]);

  useEffect(() => {
    refreshApiStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshApiStatus(true);
    });
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Root />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
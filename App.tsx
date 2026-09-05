import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { LoadingState } from './src/components/common';
import Screen from './src/components/common/Screen';
import { colors } from './src/theme';
import { refreshApiStatus } from './src/api';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

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
    return <LoginScreen />;
  }

  return <RootNavigator />;
}

export default function App() {
  useEffect(() => {
    refreshApiStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshApiStatus(true);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={theme}>
          <StatusBar style="light" />
          <Root />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

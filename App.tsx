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

import SplashScreen from './src/screens/entry/SplashScreen';
import { trainingPreferencesService } from './src/services';

function Root() {
  const { authed, checking, user } = useAuth();
  const [splashDone, setSplashDone] = React.useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    if (authed && user) {
      setCheckingOnboarding(true);
      trainingPreferencesService
        .getFor(user.id)
        .then((prefs) => {
          if (!isMounted) return;
          setHasCompletedOnboarding(prefs?.onboardingCompleted ?? false);
          setCheckingOnboarding(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setHasCompletedOnboarding(true);
          setCheckingOnboarding(false);
        });
    } else {
      setHasCompletedOnboarding(null);
      setCheckingOnboarding(false);
    }
    return () => {
      isMounted = false;
    };
  }, [authed, user?.id]);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  if (checking || (authed && checkingOnboarding)) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!authed) {
    return <EntryFlow />;
  }

  if (hasCompletedOnboarding === false) {
    return <EntryFlow initialScreen="onboarding" />;
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
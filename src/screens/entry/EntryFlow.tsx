import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import WelcomeScreen from './WelcomeScreen';
import LoginScreen from '../LoginScreen';
import OnboardingScreen from './OnboardingScreen';

type EntryScreen = 'welcome' | 'login' | 'onboarding';

function TransitionedScreen({ screen, children }: { screen: EntryScreen; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
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
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [screen, opacity, translateY]);

  return (
    <Animated.View style={[styles.fill, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Fluxo de entrada: Welcome → Login / Welcome → Onboarding (criar conta).
 * As telas alteram o estado de autenticação (login/registro) e o app troca
 * automaticamente para o RootNavigator/Home quando `authed` se torna true.
 */
export default function EntryFlow() {
  const [screen, setScreen] = useState<EntryScreen>('welcome');

  return (
    <View style={styles.fill}>
      <TransitionedScreen key={screen} screen={screen}>
        {screen === 'welcome' && (
          <WelcomeScreen
            onEnterPress={() => setScreen('login')}
            onCreatePress={() => setScreen('onboarding')}
          />
        )}
        {screen === 'login' && (
          <LoginScreen
            onBack={() => setScreen('welcome')}
            onCreateAccount={() => setScreen('onboarding')}
          />
        )}
        {screen === 'onboarding' && <OnboardingScreen onExit={() => setScreen('welcome')} />}
      </TransitionedScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
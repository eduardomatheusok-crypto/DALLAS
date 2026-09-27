import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const logoImg = require('../../../assets/images/dallas-icon-trans.png');

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // 1. Entrada da Logo com Fade-in e Scale
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Pulso sutil de glow vermelho
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(glowScale, {
          toValue: 1.2,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(glowOpacity, {
          toValue: 0.35,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 400);

    // 3. Entrada do texto DALLAS e tagline
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);

    // 4. Conclusão da Splash após ~2.1s
    const timer = setTimeout(() => {
      onFinish();
    }, 2100);

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, glowOpacity, glowScale, textOpacity, textTranslateY, onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        {/* Glow vermelho sutil atrás da logo */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Logo Oficial DALLAS */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image source={logoImg} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        {/* Texto DALLAS & Tagline */}
        <Animated.View
          style={[
            styles.textWrap,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>DALLAS</Text>
          <Text style={styles.brandTagline}>BUILD YOUR BEST.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070709',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 30, 39, 0.4)',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  logoWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 110,
    height: 110,
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF1E27',
    letterSpacing: 3,
  },
});

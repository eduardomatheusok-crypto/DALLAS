import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Image, StyleSheet, Text, View } from 'react-native';
import * as NativeSplash from 'expo-splash-screen';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!active) return;
      if (reduced) opacity.setValue(1);
      else Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    });
    const timer = setTimeout(() => finishRef.current(), 1400);
    return () => { active = false; clearTimeout(timer); opacity.stopAnimation(); };
  }, [opacity]);
  return (
    <View style={styles.root} onLayout={() => { void NativeSplash.hideAsync(); }}>
      <Animated.View style={[styles.center, { opacity }]}>
        <Image source={require('../../../assets/images/dallas-icon-trans.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="DALLAS" />
        <Text style={styles.brand}>DALLAS</Text>
        <View style={styles.accent} />
        <Text style={styles.tagline}>BUILD YOUR BEST.</Text>
      </Animated.View>
      <Text style={styles.footer}>FORÇA  /  FOCO  /  CONSTÂNCIA</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0C', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 20 },
  logo: { width: 160, height: 160 },
  brand: { color: '#FAFAFA', fontSize: 34, fontWeight: '900', letterSpacing: 7 },
  accent: { width: 40, height: 3, backgroundColor: '#FF1E27' },
  tagline: { color: '#A1A1AA', fontSize: 11, letterSpacing: 3, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 48, color: '#71717A', fontSize: 9, letterSpacing: 2 },
});

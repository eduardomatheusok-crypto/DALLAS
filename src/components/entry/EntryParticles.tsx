import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

interface Props {
  /** Cor das partículas (geralmente a cor de assinatura DALLAS). */
  color: string;
  /** Quantidade de partículas sobre o hero. */
  count?: number;
}

interface ParticleConfig {
  x: number;
  y: number;
  diameter: number;
  opacity: number;
  duration: number;
  sway: number;
  rise: number;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildParticles(width: number, height: number, count: number): ParticleConfig[] {
  return Array.from({ length: count }, () => ({
    x: rand(4, width - 4),
    y: rand(0, height),
    diameter: rand(3, 7),
    opacity: rand(0.18, 0.5),
    duration: rand(9000, 16000),
    sway: rand(-14, 14),
    rise: rand(90, 220),
  }));
}

function ParticleDot({
  particle,
  color,
  animate,
}: {
  particle: ParticleConfig;
  color: string;
  animate: boolean;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(particle.opacity)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: particle.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: particle.opacity * 0.35,
          duration: particle.duration * 0.45,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: particle.opacity,
          duration: particle.duration * 0.45,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    pulse.start();
    return () => {
      loop.stop();
      pulse.stop();
    };
  }, [animate, drift, opacity, particle]);

  const translateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -particle.rise],
  });
  const translateX = drift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, particle.sway, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          left: particle.x,
          top: particle.y,
          width: particle.diameter,
          height: particle.diameter,
          borderRadius: particle.diameter / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
}

/**
 * Partículas vermelhas sutis sobre o hero da tela de entrada.
 * Movimento lento/organico, poucas e pequenas, baixa intensidade.
 * Respeita "reduce motion" (fica estático).
 */
export default function EntryParticles({ color, count = 12 }: Props) {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const particles = useMemo(() => buildParticles(width, height, count), [width, height, count]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => (
        <ParticleDot key={i} particle={p} color={color} animate={!reduceMotion} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
  },
});
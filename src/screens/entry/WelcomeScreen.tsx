import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme';

const logoImg = require('../../../assets/images/dallas-icon-trans.png');

interface Props {
  onEnterPress: () => void;
  onCreatePress: () => void;
}

export default function WelcomeScreen({ onEnterPress, onCreatePress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Main Brand Section with centered radial red glow */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <View style={styles.radialGlow} />
          <Image source={logoImg} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.brandTitle}>DALLAS</Text>
        <Text style={styles.brandTagline}>BUILD YOUR BEST.</Text>
      </View>

      {/* Action Buttons Section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + 20, 44) }]}>
        <Pressable
          onPress={onEnterPress}
          style={({ pressed }) => [styles.buttonPrimary, pressed && styles.pressed]}
        >
          <Text style={styles.buttonPrimaryText}>ENTRAR</Text>
        </Pressable>

        <Pressable
          onPress={onCreatePress}
          style={({ pressed }) => [styles.buttonSecondary, pressed && styles.pressed]}
        >
          <Text style={styles.buttonSecondaryText}>CRIAR CONTA</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070709',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  radialGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 30, 39, 0.22)',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 45,
    elevation: 12,
  },
  logo: {
    width: 96,
    height: 96,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6.5,
  },
  brandTagline: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FF1E27',
    letterSpacing: 3.5,
    marginTop: 8,
  },
  bottomSection: {
    gap: 14,
  },
  buttonPrimary: {
    backgroundColor: '#FF1E27',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  buttonSecondary: {
    backgroundColor: '#0F0F12',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 30, 39, 0.45)',
  },
  buttonSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
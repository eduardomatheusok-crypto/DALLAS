import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '../../theme/icons';
import type { Achievement } from '../../services';

interface Props {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
  onViewAll?: () => void;
}

export default function AchievementModal({
  visible,
  achievement,
  onClose,
  onViewAll,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible && achievement) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      glowAnim.setValue(0.8);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1.25,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.85,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]).start();
    }
  }, [visible, achievement, scaleAnim, opacityAnim, glowAnim]);

  if (!visible || !achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow Effect */}
          <Animated.View
            style={[
              styles.radialGlow,
              { transform: [{ scale: glowAnim }] },
            ]}
          />

          {/* Mascote Dallas Feliz */}
          <View style={styles.mascotWrap}>
            <Image
              source={require('../../../assets/dallas/dallas_feliz.png')}
              style={styles.mascotImg}
              resizeMode="contain"
            />
          </View>

          {/* Badge & Impact Title */}
          <View style={styles.badgePill}>
            <Icon name="trophy" size={14} color="#FFD700" />
            <Text style={styles.badgePillText}>CONQUISTA DESBLOQUEADA</Text>
          </View>

          <Text style={styles.achievementName}>{achievement.name}</Text>
          <Text style={styles.modalText}>{achievement.modalText}</Text>
          <Text style={styles.triggerDesc}>{achievement.triggerDescription}</Text>

          {/* Botões */}
          <View style={styles.actionsWrap}>
            <Pressable
              style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
              onPress={onClose}
            >
              <Text style={styles.continueBtnText}>CONTINUAR</Text>
            </Pressable>

            {onViewAll ? (
              <Pressable
                style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressed]}
                onPress={onViewAll}
              >
                <Text style={styles.viewAllText}>Ver todas as conquistas</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#121216',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 30, 39, 0.5)',
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  radialGlow: {
    position: 'absolute',
    top: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 30, 39, 0.18)',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 35,
  },
  mascotWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mascotImg: {
    width: 96,
    height: 96,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 12,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
  },
  achievementName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF1E27',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  triggerDesc: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 16,
  },
  actionsWrap: {
    width: '100%',
    gap: 12,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#FF1E27',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  viewAllBtn: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

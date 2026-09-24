import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, typography, spacing } from '../../theme';
import { Icon } from '../../theme/icons';

interface ExerciseMediaViewerProps {
  startImage?: string;
  endImage?: string;
  mode?: 'full' | 'thumbnail';
  autoAnimate?: boolean;
  style?: ViewStyle;
}

export default function ExerciseMediaViewer({
  startImage,
  endImage,
  mode = 'full',
  autoAnimate = false,
  style,
}: ExerciseMediaViewerProps) {
  const [activeFrame, setActiveFrame] = useState<'start' | 'end'>('start');
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Animação contínua automática opcional (loop entre início e fim)
  useEffect(() => {
    if (!autoAnimate || !startImage || !endImage) return;

    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev === 'start' ? 'end' : 'start'));
    }, 1200);

    return () => clearInterval(interval);
  }, [autoAnimate, startImage, endImage]);

  const currentUri = activeFrame === 'start' ? startImage || endImage : endImage || startImage;

  const toggleFrame = (frame: 'start' | 'end') => {
    if (activeFrame !== frame) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveFrame(frame);
    }
  };

  if (mode === 'thumbnail') {
    return (
      <View style={[styles.thumbContainer, style]}>
        {currentUri && !hasError ? (
          <Image
            source={{ uri: currentUri }}
            style={styles.thumbImage}
            resizeMode="cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <View style={styles.fallbackThumb}>
            <Icon name="muscle" size="sm" color={colors.textMuted} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.imageBox}>
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {currentUri && !hasError ? (
          <Image
            source={{ uri: currentUri }}
            style={styles.fullImage}
            resizeMode="cover"
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          <View style={styles.fallbackFull}>
            <Icon name="muscle" size="lg" color={colors.textMuted} />
            <Text style={styles.fallbackText}>Ilustração do movimento</Text>
          </View>
        )}

        {/* Toggle interativo Início / Fim */}
        {startImage && endImage && (
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => toggleFrame('start')}
              style={[
                styles.toggleBtn,
                activeFrame === 'start' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  activeFrame === 'start' && styles.toggleTextActive,
                ]}
              >
                Início
              </Text>
            </Pressable>

            <Pressable
              onPress={() => toggleFrame('end')}
              style={[
                styles.toggleBtn,
                activeFrame === 'end' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  activeFrame === 'end' && styles.toggleTextActive,
                ]}
              >
                Fim
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  thumbContainer: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLighter,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLighter,
  },
  fallbackThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  imageBox: {
    width: '100%',
    height: 200,
    backgroundColor: '#121212',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#121212',
  },
  fallbackFull: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  fallbackText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  toggleRow: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: borderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 2,
  },
  toggleBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
});

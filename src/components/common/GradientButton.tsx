import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, gradient, typography } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'gradient' | 'surface' | 'ghost';
}

export default function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  variant = 'gradient',
}: Props) {
  const isDisabled = disabled || loading;

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.ghostBase, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[typography.button, styles.ghostText]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={
          variant === 'gradient'
            ? [gradient.primaryStart, gradient.primaryMid]
            : [colors.surfaceLight, colors.surfaceLighter]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.base}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[typography.button, variant === 'gradient' && styles.gradientText]}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  gradientText: {
    color: colors.white,
  },
  ghostBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: {
    color: colors.textSecondary,
  },
});
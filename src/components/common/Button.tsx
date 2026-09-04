import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, borderRadius, typography } from '../../theme';
import { Icon, type IconName, type AppIconName } from '../../theme/icons';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: IconName | AppIconName;
  iconPosition?: 'left' | 'right';
  compact?: boolean;
}

const BG: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.elevated,
  danger: colors.danger,
  ghost: 'transparent',
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.text,
  danger: colors.white,
  ghost: colors.textSecondary,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  icon,
  iconPosition = 'left',
  compact = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const border = variant === 'ghost' || variant === 'secondary'
    ? { borderWidth: 1, borderColor: colors.border }
    : {};
  const iconColor =
    variant === 'primary' || variant === 'danger'
      ? colors.white
      : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        !fullWidth && styles.autoWidth,
        compact && styles.compact,
        { backgroundColor: BG[variant], ...border },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={TEXT_COLOR[variant]} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <Icon name={icon} size="sm" color={iconColor} />
          ) : null}
          <Text style={[styles.text, { color: TEXT_COLOR[variant] }]}>{title}</Text>
          {icon && iconPosition === 'right' ? (
            <Icon name={icon} size="sm" color={iconColor} />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  autoWidth: {
    alignSelf: 'flex-start',
  },
  compact: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  text: {
    ...typography.button,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
});

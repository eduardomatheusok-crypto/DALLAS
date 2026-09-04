import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { Icon, type AppIconName, type IconName, type IconSize } from '../../theme/icons';

interface IconButtonProps {
  name: AppIconName | IconName;
  onPress: () => void;
  size?: IconSize | number;
  color?: string;
  bg?: string;
  border?: string;
  style?: StyleProp<ViewStyle>;
}

export default function IconButton({
  name,
  onPress,
  size = 'sm',
  color = colors.textSecondary,
  bg = colors.surface,
  border = colors.borderLight,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
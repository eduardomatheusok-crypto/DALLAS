import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon, type AppIconName, type IconName } from '../../theme/icons';

export interface MenuAction {
  label: string;
  icon?: AppIconName | IconName;
  destructive?: boolean;
  onPress: () => void;
}

interface MenuSheetProps {
  visible: boolean;
  title?: string;
  actions: MenuAction[];
  onClose: () => void;
}

export default function MenuSheet({ visible, title, actions, onClose }: MenuSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          {title ? (
            <View style={styles.header}>
              <Text style={[typography.overline, styles.title]}>{title}</Text>
            </View>
          ) : null}
          {actions.map((a, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => {
                a.onPress();
                onClose();
              }}
            >
              {a.icon ? (
                <Icon
                  name={a.icon}
                  size="sm"
                  color={a.destructive ? colors.danger : colors.text}
                />
              ) : null}
              <Text
                style={[
                  typography.body,
                  { color: a.destructive ? colors.danger : colors.text },
                ]}
              >
                {a.label}
              </Text>
            </Pressable>
          ))}
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.elevated,
  },
});
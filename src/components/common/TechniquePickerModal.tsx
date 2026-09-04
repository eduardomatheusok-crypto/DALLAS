import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import { ADVANCED_TECHNIQUES, type AdvancedTechniqueKind } from '../../models';

interface Props {
  visible: boolean;
  selected: AdvancedTechniqueKind;
  onSelect: (kind: AdvancedTechniqueKind) => void;
  onClose: () => void;
}

export default function TechniquePickerModal({ visible, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.subtitle}>Técnica avançada</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Icon name="close" size="sm" color={colors.textSecondary} />
            </Pressable>
          </View>

          <FlatList
            data={ADVANCED_TECHNIQUES}
            keyExtractor={(item) => item.kind}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const active = item.kind === selected;
              return (
                <Pressable
                  style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.pressed]}
                  onPress={() => {
                    onSelect(item.kind);
                    onClose();
                  }}
                >
                  <View style={styles.rowText}>
                    <Text style={[typography.body, active && { color: colors.primaryLight }]}>
                      {item.label}
                    </Text>
                    <Text style={[typography.small, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                  </View>
                  {active ? (
                    <View style={styles.checkWrap}>
                      <Icon name="check" size="sm" color={colors.white} />
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  rowActive: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.scrim,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});

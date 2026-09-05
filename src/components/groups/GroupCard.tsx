import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import type { GroupSummary } from '../../models';
import GroupAvatar from './GroupAvatar';

export default function GroupCard({
  group,
  onPress,
}: {
  group: GroupSummary;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <GroupAvatar emoji={group.icon} />
      <View style={styles.info}>
        <Text style={[typography.subtitle, styles.name]} numberOfLines={1}>
          {group.name}
        </Text>
        {group.description ? (
          <Text style={[typography.caption, styles.desc]} numberOfLines={1}>
            {group.description}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
        </Text>
      </View>
      <Icon name="chevron-forward" size="md" color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    textTransform: 'none',
  },
  desc: {
    color: colors.textSecondary,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
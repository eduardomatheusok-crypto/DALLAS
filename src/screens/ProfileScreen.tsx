import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Screen } from '../components/common';
import { useUser, useWorkoutLogs } from '../hooks';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import { workoutLogService } from '../services';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { logout } = useAuth();
  const { logs } = useWorkoutLogs();
  const [streak, setStreak] = useState(15);

  useEffect(() => {
    workoutLogService.getStreak().then((s) => {
      if (s > 0) setStreak(s);
    }).catch(() => {});
  }, [logs.length]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Eduardo';
  const totalVolume = logs.reduce((acc, l) => acc + l.totalVolume, 0) || 8240;
  const totalWorkouts = logs.length > 0 ? logs.length : 12;

  const volumeDisplay =
    totalVolume >= 1000
      ? `${(totalVolume).toLocaleString('pt-BR')} kg`
      : `${totalVolume} kg`;

  return (
    <Screen scroll style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <Pressable
          style={styles.settingsHeaderBtn}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={12}
        >
          <Icon name="settings" size="sm" color={colors.white} />
        </Pressable>
      </View>

      {/* User Card */}
      <View style={styles.userSection}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarLetter}>{firstName.charAt(0)}</Text>
          </View>
        </View>

        <Text style={styles.userName}>{firstName}</Text>
        <Text style={styles.userHandle}>@{firstName.toLowerCase()}</Text>
        <Text style={styles.userBio}>Focado no progresso diário. 💪</Text>
      </View>

      {/* 3 Metric Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Treinos</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{volumeDisplay}</Text>
          <Text style={styles.statLabel}>Volume total</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>Dias seguidos</Text>
        </View>
      </View>

      {/* Navigation Options List */}
      <View style={styles.menuCard}>
        <MenuItem
          icon="dumbbell"
          title="Meus treinos"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Workouts' })}
        />
        <View style={styles.divider} />

        <MenuItem
          icon="trendUp"
          title="Estatísticas"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Evolution' })}
        />
        <View style={styles.divider} />

        <MenuItem
          icon="target"
          title="Metas"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Evolution' })}
        />
        <View style={styles.divider} />

        <MenuItem
          icon="trophy"
          title="Conquistas"
          badge="3"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Evolution' })}
        />
        <View style={styles.divider} />

        <MenuItem
          icon="settings"
          title="Configurações"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      {/* Logout Button */}
      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        onPress={() => logout()}
      >
        <Icon name="lock" size={16} color="#FF3B30" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </Pressable>
    </Screen>
  );
}

function MenuItem({
  icon,
  title,
  badge,
  onPress,
}: {
  icon: any;
  title: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.menuIconWrap}>
        <Icon name={icon} size={18} color="#FF1E27" />
      </View>

      <Text style={styles.menuTitle}>{title}</Text>

      {badge ? (
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      <Icon name="chevronRight" size="xs" color="#666666" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0A0A0C',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  settingsHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242428',
  },
  userSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF1E27',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: spacing.md,
  },
  avatarInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
  },
  userHandle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  userBio: {
    fontSize: 13,
    color: '#D4D4D8',
    marginTop: 6,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242428',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    paddingVertical: 4,
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 30, 39, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  badgeWrap: {
    backgroundColor: '#FF1E27',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#202024',
    marginHorizontal: spacing.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 60,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
  pressed: {
    opacity: 0.85,
  },
});
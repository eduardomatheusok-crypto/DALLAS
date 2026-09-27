import AvatarPicker from '../components/common/AvatarPicker';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import {
  AchievementsShowcase,
  Button,
  Screen,
  UserAvatar,
} from '../components/common';
import { useUser, useWorkoutLogs } from '../hooks';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import {
  achievementService,
  communityService,
  userService,
  workoutLogService,
  type Achievement,
  type UserAchievement,
} from '../services';
import type { CommunityPost } from '../models/Post';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;
type ProfileTab = 'posts' | 'achievements';

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { logout, refresh } = useAuth();
  const { logs } = useWorkoutLogs();

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(user?.avatarUrl ?? null);

  // Conquistas
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState<{
    achievement: Achievement;
    unlocked: boolean;
    unlockedAt?: string;
  } | null>(null);

  // Minhas postagens
  const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    if (user?.avatarUrl) {
      setUserAvatar(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  useEffect(() => {
    workoutLogService.getStreak().then(setStreak).catch(() => {});
    if (user?.id) {
      achievementService.getUserAchievements(user.id).then((list) => {
        setUnlockedCount(list.length);
      }).catch(() => {});
    } else {
      setUnlockedCount(0);
    }

    const handle = user?.username ? user.username : 'eduardo';
    communityService.getUserPosts(handle).then(setMyPosts).catch(() => {});
  }, [logs.length, user?.username, user?.id]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Eduardo';
  const totalVolume = logs.reduce((acc, l) => acc + l.totalVolume, 0);
  const totalWorkouts = logs.length;
  const athleteLevel = Math.max(1, Math.floor(totalWorkouts / 3) + 1);

  const volumeDisplay =
    totalVolume >= 1000
      ? `${(totalVolume).toLocaleString('pt-BR')} kg`
      : `${totalVolume} kg`;

  const handleSaveAvatar = async () => {
    if (!draftAvatar || savingAvatar) return;
    setSavingAvatar(true);
    setAvatarError('');
    try {
      const updated = await userService.updateProfile({ avatarUrl: draftAvatar });
      if (!updated) throw new Error('Usuário não encontrado');
      setUserAvatar(updated.avatarUrl ?? null);
      await refresh();
      setAvatarModalOpen(false);
    } catch { setAvatarError('Não foi possível salvar a foto. Tente novamente.'); }
    finally { setSavingAvatar(false); }
  };

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
        <Pressable
          accessibilityLabel="Editar foto de perfil"
          accessibilityRole="button"
          style={styles.avatarTouchable}
          onPress={() => { setDraftAvatar(userAvatar); setAvatarError(''); setAvatarModalOpen(true); }}
        >
          <View style={styles.avatarRing}>
            <UserAvatar
              avatarUrl={userAvatar}
              name={firstName}
              size={76}
            />
          </View>
          <View style={styles.avatarEditBadge}>
            <Icon name="camera" size="xs" color={colors.white} />
          </View>
        </Pressable>

        <Text style={styles.userName}>{firstName}</Text>
        <Text style={styles.userHandle}>
          @{user?.username ? user.username.toLowerCase() : firstName.toLowerCase()}
        </Text>
        <Text style={styles.userBio}>Focado no progresso diário. BUILD YOUR BEST. 💪</Text>

        {/* Botão Seguir / Seguindo */}
        <View style={styles.followRow}>
          <Pressable
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setIsFollowing((prev) => !prev);
            }}
          >
            <Icon
              name={isFollowing ? 'check' : 'plus'}
              size={12}
              color={isFollowing ? '#A1A1AA' : '#FFFFFF'}
            />
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Painel de Status com Nível, Streak e Conquistas Desbloqueadas */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>Nível {athleteLevel}</Text>
          <Text style={styles.statLabel}>Nível</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF1E27' }]}>
            {streak} {streak === 1 ? 'treino' : 'treinos'}
          </Text>
          <Text style={styles.statLabel}>Sequência</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFD700' }]}>
            {unlockedCount}/16
          </Text>
          <Text style={styles.statLabel}>Conquistas</Text>
        </View>
      </View>

      {/* Segmented Tabs: Publicações | Vitrine de Conquistas */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Icon
            name="chat"
            size="xs"
            color={activeTab === 'posts' ? colors.white : '#8E8E93'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'posts' && styles.tabButtonTextActive]}
          >
            Publicações
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'achievements' && styles.tabButtonActive]}
          onPress={() => setActiveTab('achievements')}
        >
          <Icon
            name="trophy"
            size="xs"
            color={activeTab === 'achievements' ? '#FF1E27' : '#8E8E93'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'achievements' && styles.tabButtonTextActive,
            ]}
          >
            Vitrine de Conquistas ({unlockedCount}/16)
          </Text>
        </Pressable>
      </View>

      {activeTab === 'posts' ? (
        <View>
          {/* Secondary stats row: Treinos e Volume */}
          <View style={styles.secondaryStatsRow}>
            <View style={styles.secondaryStatCard}>
              <Text style={styles.secondaryStatNumber}>{totalWorkouts}</Text>
              <Text style={styles.secondaryStatLabel}>Treinos Realizados</Text>
            </View>
            <View style={styles.secondaryStatCard}>
              <Text style={styles.secondaryStatNumber}>{volumeDisplay}</Text>
              <Text style={styles.secondaryStatLabel}>Volume Levantado</Text>
            </View>
          </View>

          {/* Minhas Publicações na Comunidade */}
          <View style={styles.myPostsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Minhas Publicações</Text>
              <Pressable
                onPress={() => navigation.navigate('MainTabs', { screen: 'Community' })}
              >
                <Text style={styles.seeAllText}>Ir para feed</Text>
              </Pressable>
            </View>

            {myPosts.length === 0 ? (
              <View style={styles.emptyPostsCard}>
                <Icon name="chat" size="md" color="#8E8E93" />
                <Text style={styles.emptyPostsTitle}>Nenhuma publicação ainda</Text>
                <Text style={styles.emptyPostsDesc}>
                  Compartilhe suas vitórias, PRs e rotinas com outros atletas DALLAS.
                </Text>
                <Pressable
                  style={styles.createPostBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Community' })}
                >
                  <Text style={styles.createPostBtnText}>Compartilhar no Feed</Text>
                </Pressable>
              </View>
            ) : (
              myPosts.map((p) => (
                <View key={p.id} style={styles.myPostCard}>
                  <Text style={styles.myPostText}>{p.text}</Text>
                  <View style={styles.myPostFooter}>
                    {p.workoutTag ? (
                      <View style={styles.myPostTag}>
                        <Text style={styles.myPostTagText}>{p.workoutTag}</Text>
                      </View>
                    ) : <View />}
                    <View style={styles.myPostStats}>
                      <Icon name="heartFill" size="xs" color="#FF1E27" />
                      <Text style={styles.myPostStatText}>{p.likes}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
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
              title="Estatísticas e Gráficos"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Evolution' })}
            />
            <View style={styles.divider} />

            <MenuItem
              icon="target"
              title="Metas de Carga e Volume"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Evolution' })}
            />
            <View style={styles.divider} />

            <MenuItem
              icon="settings"
              title="Configurações e Lembretes"
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
        </View>
      ) : (
        /* Vitrine de Conquistas Tab */
        <View style={styles.showcaseWrap}>
          <AchievementsShowcase
            userId={user?.id}
            onSelectAchievement={(ach, unlocked) => {
              setSelectedAchievement({ achievement: ach, unlocked });
            }}
          />
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, { marginTop: spacing.xl }, pressed && styles.pressed]}
            onPress={() => logout()}
          >
            <Icon name="lock" size={16} color="#FF3B30" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </Pressable>
        </View>
      )}

      {/* Modal: Seletor de Foto / Avatar */}
      <Modal
        visible={avatarModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAvatarModalOpen(false)}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Foto de perfil</Text>
            <AvatarPicker value={draftAvatar} name={user?.name} onChange={setDraftAvatar} />
            {!!avatarError && <Text style={{ color: colors.danger }}>{avatarError}</Text>}
            <Button title="Salvar foto" onPress={handleSaveAvatar} loading={savingAvatar} disabled={!draftAvatar || savingAvatar} />

            <Button
              title="Fechar"
              variant="secondary"
              onPress={() => setAvatarModalOpen(false)}
              style={{ marginTop: spacing.md }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Detalhe da Conquista */}
      <Modal
        visible={selectedAchievement !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedAchievement(null)}
        >
          <Pressable style={styles.achievementDetailCard} onPress={(e) => e.stopPropagation()}>
            {selectedAchievement ? (
              <View style={{ alignItems: 'center' }}>
                <View
                  style={[
                    styles.achievementDetailIconWrap,
                    selectedAchievement.unlocked && styles.achievementDetailIconUnlocked,
                  ]}
                >
                  <Icon
                    name={selectedAchievement.achievement.icon as any}
                    size="lg"
                    color={selectedAchievement.unlocked ? '#FF1E27' : '#71717A'}
                  />
                </View>

                <View style={styles.achievementCategoryBadge}>
                  <Text style={styles.achievementCategoryText}>
                    {selectedAchievement.achievement.category}
                  </Text>
                </View>

                <Text style={styles.achievementDetailTitle}>
                  {selectedAchievement.achievement.name}
                </Text>

                <Text style={styles.achievementDetailDesc}>
                  {selectedAchievement.achievement.triggerDescription}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    selectedAchievement.unlocked
                      ? styles.statusBadgeUnlocked
                      : styles.statusBadgeLocked,
                  ]}
                >
                  <Icon
                    name={selectedAchievement.unlocked ? 'checkCircle' : 'lock'}
                    size="xs"
                    color={selectedAchievement.unlocked ? '#22C55E' : '#A1A1AA'}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      selectedAchievement.unlocked
                        ? { color: '#22C55E' }
                        : { color: '#A1A1AA' },
                    ]}
                  >
                    {selectedAchievement.unlocked
                      ? 'Conquista Desbloqueada'
                      : 'Bloqueada • Complete o desafio'}
                  </Text>
                </View>

                <Button
                  title="Fechar"
                  onPress={() => setSelectedAchievement(null)}
                  style={{ width: '100%', marginTop: spacing.lg }}
                />
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
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
    marginVertical: spacing.md,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#FF1E27',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1E27',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF1E27',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0C',
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
    textAlign: 'center',
  },
  followRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#FF1E27',
  },
  followingBtn: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  followingBtnText: {
    color: '#D4D4D8',
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  secondaryStatCard: {
    flex: 1,
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242428',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  secondaryStatNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryStatLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 3,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#141416',
    borderRadius: borderRadius.md,
    padding: 4,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: '#242428',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: '#24242A',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabButtonTextActive: {
    color: colors.white,
    fontWeight: '700',
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
  myPostsSection: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF1E27',
  },
  emptyPostsCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyPostsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.xs,
  },
  emptyPostsDesc: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  createPostBtn: {
    backgroundColor: 'rgba(255, 30, 39, 0.15)',
    borderWidth: 1,
    borderColor: '#FF1E27',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  createPostBtnText: {
    color: '#FF1E27',
    fontSize: 12,
    fontWeight: '700',
  },
  myPostCard: {
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  myPostText: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  myPostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  myPostTag: {
    backgroundColor: 'rgba(255, 30, 39, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  myPostTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF1E27',
  },
  myPostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myPostStatText: {
    fontSize: 12,
    color: '#8E8E93',
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
  showcaseWrap: {
    paddingBottom: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderColor: '#242428',
    padding: spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  presetItem: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 70,
  },
  presetItemSelected: {
    borderColor: '#FF1E27',
    backgroundColor: 'rgba(255, 30, 39, 0.1)',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetLabelSelected: {
    color: '#FF1E27',
    fontWeight: '700',
  },
  customUrlRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  customUrlInput: {
    flex: 1,
    backgroundColor: '#1C1C20',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2E2E34',
  },
  customUrlBtn: {
    backgroundColor: '#FF1E27',
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementDetailCard: {
    backgroundColor: '#141416',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  achievementDetailIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1F1F24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  achievementDetailIconUnlocked: {
    backgroundColor: 'rgba(255, 30, 39, 0.15)',
    borderWidth: 1,
    borderColor: '#FF1E27',
  },
  achievementCategoryBadge: {
    backgroundColor: '#202024',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  achievementCategoryText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  achievementDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  achievementDetailDesc: {
    fontSize: 13,
    color: '#D4D4D8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeUnlocked: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  statusBadgeLocked: {
    backgroundColor: '#1C1C20',
    borderWidth: 1,
    borderColor: '#2A2A30',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
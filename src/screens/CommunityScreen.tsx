import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { Button, EmptyState, LoadingState, Screen } from '../components/common';
import GroupCard from '../components/groups/GroupCard';
import { useGroups, useUser } from '../hooks';
import { groupService } from '../services';
import { communityService } from '../services/CommunityService';
import type { CommunityPost, PostComment } from '../models/Post';
import { colors, spacing, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;
type CommunityTab = 'for_you' | 'following' | 'explore';

export default function CommunityScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { groups, loading: groupsLoading, reload: reloadGroups } = useGroups();

  const [activeTab, setActiveTab] = useState<CommunityTab>('for_you');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // New post state
  const [composerText, setComposerText] = useState('');
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<CommunityPost | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Group join by code
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoadingPosts(true);
    const feed = await communityService.getPosts(activeTab === 'following' ? 'following' : 'for_you');
    setPosts(feed);
    setLoadingPosts(false);
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
      reloadGroups();
    }, [loadFeed, reloadGroups]),
  );

  const handleToggleLike = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updated = await communityService.toggleLike(postId);
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      if (selectedPostForDetail?.id === postId) {
        setSelectedPostForDetail(updated);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!composerText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const newPost = await communityService.createPost(composerText);
    setComposerText('');
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleAddComment = async () => {
    if (!selectedPostForDetail || !newCommentText.trim()) return;
    const comment = await communityService.addComment(
      selectedPostForDetail.id,
      newCommentText,
      user?.name ?? 'Eduardo',
      '@eduardo',
    );
    if (comment) {
      setNewCommentText('');
      const updated = await communityService.getPostById(selectedPostForDetail.id);
      if (updated) {
        setSelectedPostForDetail(updated);
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    }
  };

  const joinByCode = async () => {
    if (!code.trim()) return;
    setJoining(true);
    setError(null);
    try {
      const group = await groupService.joinByCode(code.trim());
      setCodeOpen(false);
      setJoining(false);
      navigation.navigate('GroupDetail', { groupId: group.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Código inválido.');
      setJoining(false);
    }
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Comunidade</Text>
      </View>

      {/* Tabs: Para você | Seguindo | Explorar */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabPill, activeTab === 'for_you' && styles.tabPillActive]}
          onPress={() => setActiveTab('for_you')}
        >
          <Text style={[styles.tabText, activeTab === 'for_you' && styles.tabTextActive]}>
            Para você
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabPill, activeTab === 'following' && styles.tabPillActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Seguindo
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabPill, activeTab === 'explore' && styles.tabPillActive]}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}>
            Explorar
          </Text>
        </Pressable>
      </View>

      {/* Main Tab Content */}
      {activeTab === 'explore' ? (
        <ScrollView style={styles.feedScroll} contentContainerStyle={styles.exploreContent}>
          {/* Groups & Crews Actions */}
          <View style={styles.exploreActionsRow}>
            <Pressable
              style={styles.exploreActionBtn}
              onPress={() => setCodeOpen(true)}
            >
              <Icon name="link" size="sm" color="#FF1E27" />
              <Text style={styles.exploreActionText}>Entrar com código</Text>
            </Pressable>

            <Pressable
              style={[styles.exploreActionBtn, styles.exploreActionBtnPrimary]}
              onPress={() => navigation.navigate('GroupForm')}
            >
              <Icon name="plus" size="sm" color={colors.white} />
              <Text style={[styles.exploreActionText, { color: colors.white }]}>
                Criar grupo
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionHeaderTitle}>Seus Grupos e Crews</Text>

          {groupsLoading ? (
            <LoadingState label="Carregando seus grupos..." />
          ) : groups.length === 0 ? (
            <EmptyState
              icon="people"
              title="NENHUM GRUPO AINDA"
              message="Crie um grupo de treino com sua crew ou entre com o código de convite de um amigo."
              actionLabel="Criar meu grupo"
              onAction={() => navigation.navigate('GroupForm')}
            />
          ) : (
            groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          style={styles.feedScroll}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            /* Post Composer Box */
            <View style={styles.composerCard}>
              <View style={styles.composerTop}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarLetter}>E</Text>
                </View>
                <TextInput
                  style={styles.composerInput}
                  placeholder="No que você está pensando?"
                  placeholderTextColor="#71717A"
                  value={composerText}
                  onChangeText={setComposerText}
                  multiline
                />
              </View>

              <View style={styles.composerBottom}>
                <View style={styles.mediaButtonsRow}>
                  <Pressable style={styles.mediaBtn}>
                    <Icon name="camera" size="xs" color="#8E8E93" />
                    <Text style={styles.mediaBtnText}>Foto</Text>
                  </Pressable>
                  <Pressable style={styles.mediaBtn}>
                    <Icon name="video" size="xs" color="#8E8E93" />
                    <Text style={styles.mediaBtnText}>Vídeo</Text>
                  </Pressable>
                  <Pressable style={styles.mediaBtn}>
                    <Icon name="stats" size="xs" color="#8E8E93" />
                    <Text style={styles.mediaBtnText}>Enquete</Text>
                  </Pressable>
                </View>

                {composerText.trim().length > 0 ? (
                  <Pressable style={styles.publishBtn} onPress={handleCreatePost}>
                    <Text style={styles.publishText}>Publicar</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.postCard}
              onPress={() => setSelectedPostForDetail(item)}
            >
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.postHeaderUser}>
                  {item.userAvatar ? (
                    <Image source={{ uri: item.userAvatar }} style={styles.postAvatar} />
                  ) : (
                    <View style={styles.postAvatarPlaceholder}>
                      <Text style={styles.avatarLetter}>{item.userName.charAt(0)}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.postUserName}>{item.userName}</Text>
                    <Text style={styles.postUserHandle}>
                      {item.userHandle} • {item.createdAt}
                    </Text>
                  </View>
                </View>

                <Icon name="menuVertical" size="xs" color="#8E8E93" />
              </View>

              {/* Post Body */}
              <Text style={styles.postBody}>{item.text}</Text>

              {/* Optional Post Media */}
              {item.imageUrl ? (
                <View style={styles.postMediaContainer}>
                  <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
                </View>
              ) : null}

              {/* Workout Tag if present */}
              {item.workoutTag ? (
                <View style={styles.workoutTagBadge}>
                  <Icon name="dumbbell" size="xs" color="#FF1E27" />
                  <Text style={styles.workoutTagText}>{item.workoutTag}</Text>
                </View>
              ) : null}

              {/* Action Bar: Likes / Comments / Share */}
              <View style={styles.postFooter}>
                <Pressable
                  style={styles.footerAction}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleLike(item.id);
                  }}
                  hitSlop={8}
                >
                  <Icon
                    name={item.isLiked ? 'heartFill' : 'heart'}
                    size="sm"
                    color={item.isLiked ? '#FF1E27' : '#8E8E93'}
                  />
                  <Text
                    style={[
                      styles.actionCount,
                      item.isLiked && { color: '#FF1E27', fontWeight: '700' },
                    ]}
                  >
                    {item.likes}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.footerAction}
                  onPress={() => setSelectedPostForDetail(item)}
                  hitSlop={8}
                >
                  <Icon name="chat" size="sm" color="#8E8E93" />
                  <Text style={styles.actionCount}>{item.commentsCount}</Text>
                </Pressable>

                <Pressable style={styles.footerAction} hitSlop={8}>
                  <Icon name="share" size="sm" color="#8E8E93" />
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Post Detail Modal (Comments & Replies) */}
      <Modal
        visible={selectedPostForDetail !== null}
        animationType="slide"
        onRequestClose={() => setSelectedPostForDetail(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          {/* Detail Header */}
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setSelectedPostForDetail(null)}
              hitSlop={12}
              style={styles.modalBackBtn}
            >
              <Icon name="chevronLeft" size="sm" color={colors.white} />
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Postagem</Text>
            <View style={{ width: 36 }} />
          </View>

          {selectedPostForDetail ? (
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {/* Original Post */}
              <View style={styles.modalPostContent}>
                <View style={styles.postHeader}>
                  <View style={styles.postHeaderUser}>
                    {selectedPostForDetail.userAvatar ? (
                      <Image source={{ uri: selectedPostForDetail.userAvatar }} style={styles.postAvatar} />
                    ) : (
                      <View style={styles.postAvatarPlaceholder}>
                        <Text style={styles.avatarLetter}>{selectedPostForDetail.userName.charAt(0)}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.postUserName}>{selectedPostForDetail.userName}</Text>
                      <Text style={styles.postUserHandle}>
                        {selectedPostForDetail.userHandle} • {selectedPostForDetail.createdAt}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.modalPostBody}>{selectedPostForDetail.text}</Text>

                {selectedPostForDetail.imageUrl ? (
                  <View style={styles.postMediaContainer}>
                    <Image
                      source={{ uri: selectedPostForDetail.imageUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {/* Likes row */}
                <View style={styles.detailStatsRow}>
                  <Pressable
                    style={styles.footerAction}
                    onPress={() => handleToggleLike(selectedPostForDetail.id)}
                  >
                    <Icon
                      name={selectedPostForDetail.isLiked ? 'heartFill' : 'heart'}
                      size="sm"
                      color={selectedPostForDetail.isLiked ? '#FF1E27' : '#8E8E93'}
                    />
                    <Text
                      style={[
                        styles.actionCount,
                        selectedPostForDetail.isLiked && { color: '#FF1E27' },
                      ]}
                    >
                      {selectedPostForDetail.likes}
                    </Text>
                  </Pressable>

                  <View style={styles.footerAction}>
                    <Icon name="chat" size="sm" color="#8E8E93" />
                    <Text style={styles.actionCount}>{selectedPostForDetail.commentsCount}</Text>
                  </View>
                </View>
              </View>

              {/* Comments Section */}
              <Text style={styles.commentsSectionTitle}>Comentários</Text>

              {selectedPostForDetail.comments.length === 0 ? (
                <Text style={styles.noCommentsText}>Seja o primeiro a comentar!</Text>
              ) : (
                selectedPostForDetail.comments.map((c) => (
                  <View key={c.id} style={styles.commentCard}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.avatarLetter}>{c.userName.charAt(0)}</Text>
                    </View>
                    <View style={styles.commentInfo}>
                      <View style={styles.commentUserRow}>
                        <Text style={styles.commentUserName}>{c.userName}</Text>
                        <Text style={styles.commentUserHandle}>
                          {c.userHandle} • {c.createdAt}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          ) : null}

          {/* Comment Input Footer */}
          <View style={styles.commentInputBar}>
            <TextInput
              style={styles.commentInput}
              placeholder="Adicionar um comentário..."
              placeholderTextColor="#71717A"
              value={newCommentText}
              onChangeText={setNewCommentText}
            />
            <Pressable
              style={[
                styles.sendCommentBtn,
                !newCommentText.trim() && { opacity: 0.5 },
              ]}
              disabled={!newCommentText.trim()}
              onPress={handleAddComment}
            >
              <Icon name="chevronRight" size="sm" color={colors.white} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Entrar com código de grupo */}
      <Modal visible={codeOpen} transparent animationType="slide" onRequestClose={() => setCodeOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Entrar com código</Text>
            <TextInput
              style={styles.input}
              placeholder="Cole o código do grupo"
              placeholderTextColor="#71717A"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoFocus
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="secondary" onPress={() => setCodeOpen(false)} style={{ flex: 1 }} />
              <Button
                title="Entrar"
                onPress={joinByCode}
                loading={joining}
                disabled={!code.trim() || joining}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0A0A0C',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  tabPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  tabPillActive: {
    backgroundColor: '#FF1E27',
    borderColor: '#FF1E27',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },
  exploreContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },
  exploreActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  exploreActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242428',
    paddingVertical: 12,
    gap: 6,
  },
  exploreActionBtnPrimary: {
    backgroundColor: '#FF1E27',
    borderColor: '#FF1E27',
  },
  exploreActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF1E27',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  composerCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  composerTop: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF1E27',
  },
  avatarLetter: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  composerInput: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    minHeight: 40,
    paddingTop: 8,
  },
  composerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#202024',
    paddingTop: spacing.sm,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaBtnText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  publishBtn: {
    backgroundColor: '#FF1E27',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  publishText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  postCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242428',
    padding: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#202024',
  },
  postAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#24242A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  postUserHandle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  postBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#E4E4E7',
    marginBottom: spacing.sm,
  },
  postMediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#1A1A1E',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#26262A',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  workoutTagBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 30, 39, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  workoutTagText: {
    fontSize: 11,
    color: '#FF1E27',
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.xs,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1E',
  },
  modalBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  modalPostContent: {
    borderBottomWidth: 1,
    borderBottomColor: '#202024',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  modalPostBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E4E4E7',
    marginVertical: spacing.sm,
  },
  detailStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  commentsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  noCommentsText: {
    fontSize: 13,
    color: '#71717A',
    fontStyle: 'italic',
  },
  commentCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#24242A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInfo: {
    flex: 1,
    backgroundColor: '#141416',
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#222226',
  },
  commentUserRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 2,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  commentUserHandle: {
    fontSize: 11,
    color: '#8E8E93',
  },
  commentText: {
    fontSize: 13,
    color: '#D4D4D8',
    lineHeight: 18,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#121214',
    borderTopWidth: 1,
    borderTopColor: '#202024',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1A1A1E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A30',
  },
  sendCommentBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF1E27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: '#242428',
    padding: spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: '#1C1C20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#2E2E34',
  },
  errorText: {
    color: colors.primary,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
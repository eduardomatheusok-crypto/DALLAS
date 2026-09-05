import React, { useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Screen,
  ScreenHeader,
  SegmentedTabs,
  Button,
  IconButton,
  LoadingState,
  ErrorState,
  EmptyState,
  Card,
  MenuSheet,
  ConfirmationModal,
} from '../components/common';
import GroupAvatar from '../components/groups/GroupAvatar';
import RankingList from '../components/groups/RankingList';
import ChatView from '../components/groups/ChatView';
import CompetitionCard from '../components/groups/CompetitionCard';
import { useGroup, useCompetitions, useRanking, useUser } from '../hooks';
import { groupService, competitionService } from '../services';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Icon } from '../theme/icons';
import type { RootStackParamList } from '../navigation/types';
import type { Competition } from '../models';

type Nav = StackNavigationProp<RootStackParamList>;
type Tab = 'ranking' | 'competitions' | 'chat';

export default function GroupDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<{ key: string; name: string; params: { groupId: string } }>();
  const { groupId } = route.params;

  const { user } = useUser();
  const { group, loading, error, reload, join, leave } = useGroup(groupId);
  const { competitions, loading: compLoading, busy, reload: reloadComps, join: joinComp } =
    useCompetitions(groupId);

  const [tab, setTab] = useState<Tab>('ranking');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState<Competition | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      reload();
      reloadComps();
    }, [reload, reloadComps]),
  );

  const featured = useMemo(() => {
    const list = competitions;
    if (selectedId) {
      const picked = list.find((c) => c.id === selectedId);
      if (picked) return picked;
    }
    return (
      list.find((c) => c.status === 'ACTIVE')
      ?? list.find((c) => c.status === 'FINISHED')
      ?? list[0]
      ?? null
    );
  }, [competitions, selectedId]);

  const { ranking, loading: rankingLoading, reload: reloadRanking } = useRanking(
    featured?.id ?? null,
  );

  const isOwner = !!group && group.ownerId === user?.id;
  const myUserId = user?.id;

  if (loading && !group) {
    return (
      <Screen>
        <LoadingState label="Carregando grupo..." />
      </Screen>
    );
  }
  if (error && !group) {
    return (
      <Screen>
        <ErrorState message={error} />
        <Button title="Entrar no grupo" onPress={async () => { try { await join(); reload(); } catch (e) { /* ignore */ } }} />
      </Screen>
    );
  }
  if (!group) return null;

  const goToCreateCompetition = () =>
    navigation.navigate('CompetitionForm', { groupId });

  const onPressCompetition = (c: Competition) => {
    setSelectedId(c.id);
    setTab('ranking');
    reloadRanking();
  };

  const handleLeave = async () => {
    setConfirmLeave(false);
    try {
      await leave();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Não foi possível sair', e instanceof Error ? e.message : 'Erro inesperado.');
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    try {
      await groupService.remove(groupId);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Não foi possível excluir', e instanceof Error ? e.message : 'Erro inesperado.');
    }
  };

  const handleFinish = async () => {
    const target = confirmFinish;
    setConfirmFinish(null);
    if (!target) return;
    try {
      await competitionService.finish(target.id);
      reloadComps();
      reloadRanking();
      setSelectedId(target.id);
    } catch (e) {
      Alert.alert('Não foi possível encerrar', e instanceof Error ? e.message : 'Erro inesperado.');
    }
  };

  return (
    <Screen>
      <ScreenHeader
        overline={`${group.memberCount} ${group.memberCount === 1 ? 'membro' : 'membros'}`}
        title={group.name}
        right={<IconButton name="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />}
      />

      <GroupAvatar emoji={group.icon} size="lg" style={styles.avatar} />
      {group.description ? (
        <Text style={styles.description}>{group.description}</Text>
      ) : null}

      <Card style={styles.inviteCard}>
        <View style={styles.inviteRow}>
          <Icon name="link" size="sm" color={colors.textMuted} />
          <Text style={[typography.body, styles.inviteCode]}>{group.inviteCode}</Text>
        </View>
        <Text style={styles.inviteHint}>
          Compartilhe esse código com amigos para convidá-los ao grupo.
        </Text>
      </Card>

      <SegmentedTabs<Tab>
        options={[
          { value: 'ranking', label: 'Ranking' },
          { value: 'competitions', label: 'Competição' },
          { value: 'chat', label: 'Chat' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <View style={styles.content}>
        {tab === 'ranking' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={rankingLoading} onRefresh={reloadRanking} />}
          >
            {featured ? (
              <>
                <View style={styles.sectionHead}>
                  <View style={styles.sectionHeadText}>
                    <Text style={[typography.overline, styles.compName]} numberOfLines={1}>
                      {featured.name}
                    </Text>
                    <Text style={styles.compStatus}>
                      {featured.status === 'ACTIVE'
                        ? 'Atualiza a cada treino registrado'
                        : featured.status === 'FINISHED'
                          ? 'Resultado final'
                          : 'Aguardando início'}
                    </Text>
                  </View>
                  {featured.status === 'FINISHED' ? (
                    <Text style={styles.podium}>🏁 {featured.participantCount} participantes</Text>
                  ) : null}
                </View>
                <RankingList ranking={ranking} myUserId={myUserId} loading={rankingLoading} />
                <Text style={styles.scoreHint}>
                  Pontos = 40% progressão + 30% consistência + 20% volume + 10% metas. Toque em
                  uma linha para ver o detalhe.
                </Text>
              </>
            ) : (
              <EmptyState
                icon="trophy"
                title="SEM COMPETIÇÃO AINDA"
                message={
                  isOwner
                    ? 'Crie a primeira competição do grupo e desafie sua crew.'
                    : 'O administrador do grupo ainda não criou competições.'
                }
                actionLabel={isOwner ? 'Criar competição' : undefined}
                onAction={isOwner ? goToCreateCompetition : undefined}
              />
            )}
          </ScrollView>
        ) : null}

        {tab === 'competitions' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={compLoading} onRefresh={reloadComps} />}
          >
            {isOwner ? (
              <Button title="Nova competição" icon="add" onPress={goToCreateCompetition} />
            ) : null}
            {!compLoading && competitions.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="NENHUMA COMPETIÇÃO"
                message="Competições criadas pelo administrador aparecem aqui."
              />
            ) : (
              competitions.map((c) => (
                <CompetitionCard
                  key={c.id}
                  competition={c}
                  onPress={() => onPressCompetition(c)}
                  onJoin={c.joined ? undefined : () => joinComp(c.id)}
                  onFinish={c.status === 'ACTIVE' && isOwner ? () => setConfirmFinish(c) : undefined}
                  canFinish={c.status === 'ACTIVE' && isOwner}
                  joining={busy}
                />
              ))
            )}
          </ScrollView>
        ) : null}

        {tab === 'chat' ? <ChatView groupId={groupId} myUserId={myUserId} /> : null}
      </View>

      <MenuSheet
        visible={menuOpen}
        title={group.name}
        onClose={() => setMenuOpen(false)}
        actions={[
          {
            label: 'Ver membros',
            icon: 'people',
            onPress: () => {
              const members = group.members.map((m) => m.user.name).join(', ');
              Alert.alert(`Membros (${group.members.length})`, members);
            },
          },
          ...(isOwner
            ? [{ label: 'Excluir grupo', icon: 'trash' as const, destructive: true, onPress: () => setConfirmDelete(true) }]
            : [{ label: 'Sair do grupo', icon: 'exit' as const, destructive: true, onPress: () => setConfirmLeave(true) }]),
        ]}
      />

      <ConfirmationModal
        visible={confirmLeave}
        title="Sair do grupo?"
        message="Você deixará de participar das competições e do chat deste grupo."
        confirmLabel="Sair"
        onConfirm={handleLeave}
        onCancel={() => setConfirmLeave(false)}
        danger
      />

      <ConfirmationModal
        visible={confirmDelete}
        title="Excluir grupo?"
        message="O grupo, competições e histórico de mensagens serão apagados. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        danger
      />

      <ConfirmationModal
        visible={!!confirmFinish}
        title="Encerrar competição agora?"
        message="O ranking será congelado e o resultado anunciado no chat do grupo."
        confirmLabel="Encerrar"
        onConfirm={handleFinish}
        onCancel={() => setConfirmFinish(null)}
        danger
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inviteCard: {
    marginBottom: spacing.lg,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inviteCode: {
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.white,
  },
  inviteHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionHeadText: {
    flex: 1,
    gap: 2,
  },
  compName: {
    color: colors.primary,
  },
  compStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  podium: {
    fontSize: 12,
    color: colors.textMuted,
  },
  scoreHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 16,
  },
});
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon } from '../../theme/icons';
import {
  achievementService,
  ACHIEVEMENTS,
  type Achievement,
  type UserAchievement,
  type AchievementCategory,
} from '../../services';

const CATEGORIES: AchievementCategory[] = [
  'Primeiros Passos',
  'Consistência e Hábitos',
  'Desempenho e Superação',
  'Situações e Desafios',
];

import { useAuth } from '../../auth/AuthContext';

interface Props {
  userId?: string;
  onSelectAchievement?: (achievement: Achievement, unlocked: boolean) => void;
}

export default function AchievementsShowcase({ userId, onSelectAchievement }: Props) {
  const { user } = useAuth();
  const effectiveUserId = userId ?? user?.id;
  const [unlockedList, setUnlockedList] = useState<UserAchievement[]>([]);
  const [selectedCat, setSelectedCat] = useState<AchievementCategory | 'TODAS'>('TODAS');

  useEffect(() => {
    if (!effectiveUserId) {
      setUnlockedList([]);
      return;
    }
    achievementService.getUserAchievements(effectiveUserId).then(setUnlockedList).catch(() => {});
  }, [effectiveUserId]);

  const unlockedMap = new Map(unlockedList.map((u) => [u.achievementId, u.unlockedAt]));
  const unlockedCount = unlockedMap.size;
  const totalCount = ACHIEVEMENTS.length;

  const filteredAchievements = selectedCat === 'TODAS'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === selectedCat);

  return (
    <View style={styles.container}>
      {/* Resumo do Progresso */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryTitle}>VITRINE DE CONQUISTAS</Text>
          <Text style={styles.summarySub}>
            {unlockedCount} de {totalCount} desbloqueadas
          </Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>
            {Math.round((unlockedCount / totalCount) * 100)}%
          </Text>
        </View>
      </View>

      {/* Filtro por Categorias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Pressable
          style={[styles.filterPill, selectedCat === 'TODAS' && styles.filterPillActive]}
          onPress={() => setSelectedCat('TODAS')}
        >
          <Text style={[styles.filterText, selectedCat === 'TODAS' && styles.filterTextActive]}>
            Todas
          </Text>
        </Pressable>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCat === cat;
          return (
            <Pressable
              key={cat}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Grid de Conquistas */}
      <View style={styles.grid}>
        {filteredAchievements.map((item) => {
          const isUnlocked = unlockedMap.has(item.id);
          const unlockedAt = unlockedMap.get(item.id);

          return (
            <Pressable
              key={item.id}
              style={[
                styles.itemCard,
                isUnlocked && styles.itemCardUnlocked,
              ]}
              onPress={() => onSelectAchievement?.(item, isUnlocked)}
            >
              <View
                style={[
                  styles.iconWrap,
                  isUnlocked
                    ? { backgroundColor: `${item.badgeColor}25`, borderColor: item.badgeColor }
                    : styles.iconWrapLocked,
                ]}
              >
                <Icon
                  name={isUnlocked ? (item.icon as any) : 'lock'}
                  size={20}
                  color={isUnlocked ? item.badgeColor : '#52525B'}
                />
              </View>

              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, isUnlocked && styles.itemNameUnlocked]}>
                  {item.name}
                </Text>
                <Text style={styles.itemTrigger}>{item.triggerDescription}</Text>
                {isUnlocked && unlockedAt ? (
                  <Text style={styles.unlockedDate}>
                    Conquistada em {new Date(unlockedAt).toLocaleDateString('pt-BR')}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121216',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.25)',
  },
  summaryLeft: {
    gap: 4,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF1E27',
    letterSpacing: 1.2,
  },
  summarySub: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryBadge: {
    backgroundColor: 'rgba(255, 30, 39, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 39, 0.3)',
  },
  summaryBadgeText: {
    color: '#FF1E27',
    fontSize: 14,
    fontWeight: '900',
  },
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    backgroundColor: '#141418',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#24242A',
  },
  filterPillActive: {
    backgroundColor: '#FF1E27',
    borderColor: '#FF1E27',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E1E24',
    gap: 14,
  },
  itemCardUnlocked: {
    borderColor: 'rgba(255, 30, 39, 0.3)',
    backgroundColor: '#15151A',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  iconWrapLocked: {
    backgroundColor: '#18181D',
    borderColor: '#27272F',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#71717A',
  },
  itemNameUnlocked: {
    color: '#FFFFFF',
  },
  itemTrigger: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 16,
  },
  unlockedDate: {
    fontSize: 10,
    color: '#FF1E27',
    fontWeight: '600',
    marginTop: 2,
  },
});

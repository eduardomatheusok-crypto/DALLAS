import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/common';
import ProgressTab from './evolution/ProgressTab';
import HistoryTab from './evolution/HistoryTab';
import RecordsTab from './evolution/RecordsTab';
import { colors, spacing } from '../theme';

type TabKey = 'progress' | 'history' | 'records';

export default function EvolutionScreen() {
  const [tab, setTab] = useState<TabKey>('progress');

  return (
    <Screen scroll={false} style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.overline}>SUA EVOLUÇÃO</Text>
      </View>

      {/* 3 Tabs: Progresso | Histórico | Recordes */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabPill, tab === 'progress' && styles.tabPillActive]}
          onPress={() => setTab('progress')}
        >
          <Text style={[styles.tabText, tab === 'progress' && styles.tabTextActive]}>
            Progresso
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabPill, tab === 'history' && styles.tabPillActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            Histórico
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabPill, tab === 'records' && styles.tabPillActive]}
          onPress={() => setTab('records')}
        >
          <Text style={[styles.tabText, tab === 'records' && styles.tabTextActive]}>
            Recordes
          </Text>
        </Pressable>
      </View>

      {/* Tab Content */}
      {tab === 'progress' && <ProgressTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'records' && <RecordsTab />}
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
  overline: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: '#FF1E27',
    textTransform: 'uppercase',
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
});
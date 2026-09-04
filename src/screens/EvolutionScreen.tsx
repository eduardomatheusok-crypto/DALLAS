import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SegmentedTabs, Screen, ScreenHeader } from '../components/common';
import ProgressTab from './evolution/ProgressTab';
import HistoryTab from './evolution/HistoryTab';

export default function EvolutionScreen() {
  const [tab, setTab] = useState<'progress' | 'history'>('progress');

  return (
    <Screen scroll={false}>
      <ScreenHeader
        overline="Sua evolução"
        title="Evolução"
      />

      <SegmentedTabs<'progress' | 'history'>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'progress', label: 'Progresso' },
          { value: 'history', label: 'Histórico' },
        ]}
      />

      {tab === 'progress' ? <ProgressTab /> : <HistoryTab />}
    </Screen>
  );
}

const styles = StyleSheet.create({});
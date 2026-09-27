import React, { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { WorkoutSummary } from '../../models/WorkoutSummary';

export function formatWorkoutTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map(n => String(n).padStart(2, '0')).join(':');
}
const WorkoutShareCard = forwardRef<View, { summary: WorkoutSummary; onReady: () => void; onLayout?: (ratio: number) => void }>(({ summary, onReady, onLayout }, ref) => (
  <View ref={ref} collapsable={false} style={{ width: '100%', backgroundColor: '#0A0A0C' }} onLayout={event => onLayout?.(event.nativeEvent.layout.width / event.nativeEvent.layout.height)}>
    <View style={styles.card}>
    <View style={styles.brand}>
      <Image source={require('../../../assets/images/dallas-icon-trans.png')} style={styles.logo} resizeMode="contain" onLoad={onReady} />
      <Text style={styles.wordmark}>DALLAS</Text>
    </View>
    <View style={styles.line} />
    <Text style={styles.eyebrow}>TREINO CONCLUÍDO</Text>
    <Text style={styles.name}>{summary.workoutName}</Text>
    <View style={styles.metrics}>
      <View><Text style={styles.label}>VOLUME</Text><Text style={styles.value}>{summary.volume.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg</Text></View>
      <View style={styles.row}>
        <View><Text style={styles.label}>TEMPO TOTAL</Text><Text style={styles.value}>{formatWorkoutTime(summary.durationSeconds)}</Text></View>
        <View><Text style={styles.label}>SÉRIES REALIZADAS</Text><Text style={styles.value}>{summary.series}</Text></View>
      </View>
    </View>
    <Text style={styles.footer}>BUILD YOUR BEST.</Text>
    </View>
  </View>
));
export default WorkoutShareCard;
const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: '#0A0A0C', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#302025', gap: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 44, height: 44 },
  wordmark: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: 4 },
  line: { height: 3, width: 44, backgroundColor: '#FF1E27', marginVertical: 2 },
  eyebrow: { color: '#FF454D', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  name: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  metrics: { gap: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { color: '#A1A1AA', fontSize: 10, fontWeight: '700', marginBottom: 6 },
  value: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  footer: { color: '#A1A1AA', fontSize: 9, letterSpacing: 1, marginTop: 8 },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, ScreenHeader, Section, Card } from '../components/common';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Icon } from '../theme/icons';

export default function CommunityScreen() {
  return (
    <Screen scroll>
      <ScreenHeader overline="Comunidade" title="Comunidade" />

      <View style={styles.featureGrid}>
        <FeatureCard icon="people" label="Feed" caption="Atividade de quem você segue" />
        <FeatureCard icon="globe" label="Explorar" caption="Descubra novos treinos" />
        <FeatureCard icon="layers" label="Grupos" caption="Treine junto com sua crew" />
        <FeatureCard icon="trophy" label="Desafios" caption="Metas e competições" />
      </View>

      <Section title="Sua comunidade" style={styles.section}>
        <Card style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="people" size={22} color={colors.textMuted} />
          </View>
          <Text style={[typography.subtitle, styles.emptyTitle]}>
            AINDA VAI COMEÇAR POR AQUI
          </Text>
          <Text style={[typography.bodySecondary, styles.emptyText]}>
            Em breve você verá a atividade de quem treina junto com você, grupos e
            desafios. Por enquanto, mantenha a disciplina no seu próprio treino.
          </Text>
        </Card>
      </Section>
    </Screen>
  );
}

function FeatureCard({ icon, label, caption }: { icon: string; label: string; caption: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Icon name={icon as never} size={20} color={colors.text} />
      </View>
      <Text style={[typography.body, styles.featureLabel]}>{label}</Text>
      <Text style={styles.featureCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  feature: {
    width: '47%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureLabel: {
    fontWeight: '700',
  },
  featureCaption: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  section: {
    marginTop: spacing.md,
  },
  card: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
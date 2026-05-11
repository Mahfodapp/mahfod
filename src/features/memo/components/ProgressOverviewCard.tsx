import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { Card } from '@/shared/ui/Card';
import { ProgressRing } from '@/shared/ui/ProgressRing';
import { colors, spacing, typography } from '@/shared/theme';

export function ProgressOverviewCard() {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.content}>
          <MText weight="bold" style={styles.title}>تقدمك العام</MText>
          <MText weight="regular" style={styles.description}>
            حافظ على استمرارية المراجعة اليومية
            لتحسين التثبيت طويل المدى.
          </MText>
        </View>
        <ProgressRing value={72} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  content: { flex: 1 },
  title: { ...typography.h2, fontSize: 20, color: colors.textPrimary },
  description: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 24, marginTop: spacing.sm + 2 },
});

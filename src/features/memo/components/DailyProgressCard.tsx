import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { Card } from '@/shared/ui/Card';
import { colors, spacing, radius, typography } from '@/shared/theme';

export function DailyProgressCard() {
  return (
    <Card style={styles.card}>
      <MText weight="regular" style={styles.label}>مراجعات اليوم</MText>
      <MText weight="bold" style={styles.count}>18</MText>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
      <MText weight="regular" style={styles.caption}>أنجزت 72٪ من هدفك اليومي</MText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  label: { ...typography.bodySmall, color: colors.textSecondary },
  count: { color: colors.textPrimary, fontSize: 52, marginTop: spacing.sm + 2 },
  progressTrack: { height: 12, borderRadius: radius.full, backgroundColor: colors.border, marginTop: spacing.lg, overflow: 'hidden' },
  progressFill: { width: '72%', height: '100%', borderRadius: radius.full, backgroundColor: colors.accent },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
});

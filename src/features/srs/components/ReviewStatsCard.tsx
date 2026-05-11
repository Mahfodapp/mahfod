import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { Card } from '@/shared/ui/Card';
import { colors, spacing, typography } from '@/shared/theme';

export function ReviewStatsCard() {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <MText weight="bold" style={styles.value}>128</MText>
          <MText weight="regular" style={styles.label}>مراجعة</MText>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <MText weight="bold" style={styles.value}>92%</MText>
          <MText weight="regular" style={styles.label}>ثبات</MText>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <MText weight="bold" style={styles.value}>18</MText>
          <MText weight="regular" style={styles.label}>جلسة</MText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  value: { ...typography.h2, color: colors.textPrimary, fontSize: 26 },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.xs + 2 },
  divider: { width: 1, height: 42, backgroundColor: colors.border },
});

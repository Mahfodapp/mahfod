import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { Card } from '@/shared/ui/Card';
import { colors, spacing, radius, typography } from '@/shared/theme';

export function StreakCard() {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View>
          <MText weight="bold" style={styles.title}>سلسلة المراجعة</MText>
          <MText weight="regular" style={styles.description}>
            واصل المراجعة يوميًا للحفاظ على السلسلة
          </MText>
        </View>
        <View style={styles.badge}>
          <MText weight="bold" style={styles.badgeValue}>14</MText>
          <MText weight="regular" style={styles.badgeLabel}>يوم</MText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, fontSize: 20, color: colors.textPrimary },
  description: { ...typography.bodySmall, color: colors.textMuted, lineHeight: 22, marginTop: spacing.sm, maxWidth: 220 },
  badge: {
    width: 88, height: 88, borderRadius: radius.xl + 4,
    backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.accentBorder,
  },
  badgeValue: { ...typography.h1, color: colors.accent, fontSize: 28 },
  badgeLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});

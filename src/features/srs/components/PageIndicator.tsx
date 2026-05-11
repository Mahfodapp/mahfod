import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

interface Props {
  page: number;
}

export function PageIndicator({ page }: Props) {
  return (
    <View style={styles.container}>
      <MText weight="regular" style={styles.label}>صفحة</MText>
      <MText weight="bold" style={styles.page}>{page}</MText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: radius.full, backgroundColor: colors.glassCard,
    marginBottom: spacing.lg,
  },
  label: { ...typography.label, color: colors.textMuted, marginRight: spacing.sm },
  page: { ...typography.bodySmall, color: colors.accent },
});

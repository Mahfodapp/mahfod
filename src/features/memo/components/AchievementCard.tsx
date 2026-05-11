import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

interface Props {
  title: string;
  subtitle: string;
}

export function AchievementCard({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon} />
      <MText weight="bold" style={styles.title}>{title}</MText>
      <MText weight="regular" style={styles.subtitle}>{subtitle}</MText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160, borderRadius: radius.xl, padding: spacing.lg,
    backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.md,
  },
  icon: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.accentSoft, marginBottom: spacing.lg,
  },
  title: { ...typography.bodySmall, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textMuted, lineHeight: 20, marginTop: spacing.sm },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from './MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

interface Props {
  title: string;
  subtitle?: string;
  description?: string;
}

export function EmptyState({ title, subtitle, description }: Props) {
  const desc = description || subtitle;
  return (
    <View style={styles.container}>
      <View style={styles.icon} />
      <MText weight="bold" style={styles.title}>
        {title}
      </MText>
      {desc ? (
        <MText weight="regular" style={styles.description}>
          {desc}
        </MText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.glassCard,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    lineHeight: 24,
  },
});

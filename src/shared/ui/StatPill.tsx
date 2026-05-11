import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from './MText';
import { colors, spacing, radius, typography, fonts } from '@/shared/theme';

interface Props {
  label: string;
}

export function StatPill({ label }: Props) {
  return (
    <View style={styles.container}>
      <MText weight="semi" style={styles.text}>
        {label}
      </MText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.label,
    color: colors.textSecondary,
  },
});

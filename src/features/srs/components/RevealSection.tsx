import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

interface Props {
  onReveal: () => void;
}

export function RevealSection({ onReveal }: Props) {
  return (
    <Pressable onPress={onReveal} style={styles.button}>
      <MText weight="semi" style={styles.text}>إظهار التذكير</MText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 58, borderRadius: radius.xl,
    backgroundColor: colors.glassCard,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  text: { ...typography.bodySmall, color: colors.textSecondary, fontFamily: undefined },
});

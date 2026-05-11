import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

interface Props {
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export function QuickActionButton({ title, subtitle, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.icon} />
      <MText weight="bold" style={styles.title}>{title}</MText>
      <MText weight="regular" style={styles.subtitle}>{subtitle}</MText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, minHeight: 138, borderRadius: radius.xl, padding: spacing.lg,
    backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  icon: {
    width: 44, height: 44, borderRadius: radius.md + 2,
    backgroundColor: colors.accentSoft, marginBottom: spacing.lg,
  },
  title: { ...typography.body, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textMuted, lineHeight: 20, marginTop: spacing.sm },
});

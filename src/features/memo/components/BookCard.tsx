import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

interface Props {
  title: string;
  pages: number;
  progress: number;
  onPress?: () => void;
}

export function BookCard({ title, pages, progress, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.bookSpine} />
      <MText numberOfLines={2} weight="bold" style={styles.title}>{title}</MText>
      <MText weight="regular" style={styles.meta}>{pages} صفحة</MText>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168, borderRadius: radius.xl, padding: spacing.lg,
    backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.md,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.985 }] },
  bookSpine: {
    width: 6, height: 48, borderRadius: radius.full,
    backgroundColor: colors.accent, marginBottom: spacing.lg,
  },
  title: { ...typography.body, color: colors.textPrimary, lineHeight: 28, minHeight: 56 },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg },
  progressTrack: { height: 10, borderRadius: radius.full, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.accent },
});

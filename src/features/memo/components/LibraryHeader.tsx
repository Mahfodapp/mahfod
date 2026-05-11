/**
 * LibraryHeader — top bar for MemoLibraryScreen.
 * RTL: back arrow on the RIGHT, grid toggle on the LEFT.
 * Shows total memo count as subtitle.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing } from '@/shared/theme';
import { LayoutGrid, List, ChevronRight } from 'lucide-react-native';

interface Props {
  total: number;
  viewMode: 'shelf' | 'list';
  onToggleView: () => void;
  onBack: () => void;
}

export function LibraryHeader({ total, viewMode, onToggleView, onBack }: Props) {
  return (
    <View style={styles.container}>
      {/* LEFT: grid/list toggle */}
      <Pressable
        onPress={onToggleView}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        hitSlop={10}
      >
        {viewMode === 'shelf' ? (
          <LayoutGrid size={22} color={colors.accent} strokeWidth={1.8} />
        ) : (
          <List size={22} color={colors.accent} strokeWidth={1.8} />
        )}
      </Pressable>

      {/* CENTER: title + count */}
      <View style={styles.center}>
        <MText weight="bold" style={styles.title}>مكتبتي</MText>
        <MText weight="regular" style={styles.subtitle}>
          {total} محفوظ
        </MText>
      </View>

      {/* RIGHT: back arrow (RTL) */}
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        hitSlop={10}
      >
        <ChevronRight size={24} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.6,
  },
});

import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

const actions = [
  { label: 'ضعيف', color: colors.error },
  { label: 'جيد', color: colors.warning },
  { label: 'ممتاز', color: colors.accent },
];

export function MemoryActions() {
  return (
    <View style={styles.row}>
      {actions.map(action => (
        <Pressable
          key={action.label}
          style={[styles.button, { backgroundColor: action.color }]}
        >
          <MText weight="bold" style={styles.text}>{action.label}</MText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  button: { flex: 1, height: 58, borderRadius: radius.xl, justifyContent: 'center', alignItems: 'center' },
  text: { ...typography.bodySmall, color: colors.primary },
});

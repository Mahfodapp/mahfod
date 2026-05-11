import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

export function SessionTopActions() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.action}>
        <MText weight="semi" style={styles.text}>خروج</MText>
      </Pressable>
      <Pressable style={styles.action}>
        <MText weight="semi" style={styles.text}>تركيز</MText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  action: {
    height: 42, paddingHorizontal: spacing.lg,
    borderRadius: radius.md + 2, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.glassCard,
  },
  text: { ...typography.label, color: colors.textSecondary },
});

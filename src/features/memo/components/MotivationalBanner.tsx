import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

export function MotivationalBanner() {
  return (
    <View style={styles.container}>
      <MText weight="bold" style={styles.title}>
        استمر، أنت تبني ثباتًا عظيمًا
      </MText>
      <MText weight="regular" style={styles.description}>
        المراجعة الصغيرة اليومية أفضل من الجلسات المتقطعة الطويلة.
      </MText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl + 4, padding: spacing.lg,
    backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder,
    marginBottom: spacing.lg,
  },
  title: { ...typography.h2, fontSize: 20, color: colors.textPrimary },
  description: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 24, marginTop: spacing.sm + 2 },
});

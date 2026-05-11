import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';
import { SessionProgressBar } from './SessionProgressBar';

export function SessionHeader() {
  return (
    <View style={styles.wrapper}>
      <SessionProgressBar progress={72} />
      <View style={styles.container}>
        <View>
          <MText weight="bold" style={styles.title}>جلسة مراجعة</MText>
          <MText weight="regular" style={styles.subtitle}>الصفحة 18 • 12 مراجعة متبقية</MText>
        </View>
        <View style={styles.progressCircle}>
          <MText weight="bold" style={styles.progressText}>72%</MText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 24 },
  subtitle: { ...typography.label, color: colors.textMuted, marginTop: spacing.xs },
  progressCircle: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  progressText: { ...typography.body, color: colors.accent },
});

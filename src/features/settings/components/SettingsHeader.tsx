import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, typography } from '@/shared/theme';

export function SettingsHeader() {
  return (
    <View style={styles.container}>
      <MText weight="extra" style={styles.title}>الإعدادات</MText>
      <MText weight="regular" style={styles.subtitle}>
        تخصيص التطبيق وتجربة الحفظ
      </MText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl + 6 },
  title: { ...typography.display, color: colors.textPrimary, textAlign: 'left' },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs + 2, textAlign: 'left' },
});

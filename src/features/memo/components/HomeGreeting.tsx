import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { colors, spacing, typography, fonts } from '@/shared/theme';

export function HomeGreeting() {
  const { user, isGuest } = useAuthStore();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    (isGuest ? 'الضيف' : '');

  return (
    <View style={styles.container}>
      <MText weight="extra" style={styles.greeting}>
        السلام عليكم
        {displayName ? (
          <MText weight="extra" style={styles.name}>{` ، ${displayName}`}</MText>
        ) : null}
      </MText>
      <MText weight="regular" style={styles.sub}>
        ليس بعلم ما حوى القمطر — ما العلم إلا ما حواه الصدر
      </MText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl + 4 },
  greeting: { color: colors.textPrimary, fontFamily: fonts.extra, fontSize: 26, lineHeight: 36 },
  name: { color: colors.accent, fontFamily: fonts.extra, fontSize: 26 },
  sub: {
    ...typography.label, color: colors.textMuted, lineHeight: 20,
    marginTop: spacing.xs + 2, fontStyle: 'italic',
  },
});

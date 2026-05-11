import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, typography } from '@/shared/theme';

interface Props {
  current: number;
  total: number;
}

export function SessionFooter({ current, total }: Props) {
  return (
    <View style={styles.container}>
      <MText weight="semi" style={styles.text}>
        {total} / {current}
      </MText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: spacing.lg },
  text: { ...typography.label, color: colors.textMuted },
});

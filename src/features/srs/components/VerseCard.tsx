import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, fonts } from '@/shared/theme';
import { ReadingSurface } from './ReadingSurface';

interface Props {
  verse: string;
}

export function VerseCard({ verse }: Props) {
  return (
    <ReadingSurface>
      <View style={styles.container}>
        <MText weight="regular" style={styles.verse}>
          {verse}
        </MText>
      </View>
    </ReadingSurface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.sm + 2 },
  verse: {
    color: colors.textPrimary,
    fontSize: 38,
    lineHeight: 78,
    textAlign: 'center',
    fontFamily: fonts.quran,
    letterSpacing: 0.6,
  },
});

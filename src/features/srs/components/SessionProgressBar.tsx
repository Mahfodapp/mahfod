import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

interface Props {
  progress: number;
}

export function SessionProgressBar({ progress }: Props) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${progress}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
});

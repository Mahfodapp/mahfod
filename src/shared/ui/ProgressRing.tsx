import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MText } from './MText';
import { colors, radius, typography } from '@/shared/theme';

interface Props {
  value: number;
}

export function ProgressRing({ value }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <MText weight="bold" style={styles.value}>
          {value}%
        </MText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: colors.accent,
  },
  inner: {
    width: 70,
    height: 70,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    ...typography.h3,
    color: colors.textPrimary,
  },
});

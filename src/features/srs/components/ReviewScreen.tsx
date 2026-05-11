/**
 * ReviewScreen — Shared screen wrapper for SRS review sessions.
 *
 * Rules:
 * - Uses colors.primary (not colors.background which doesn't exist)
 * - spacing.* tokens for padding
 * - SafeAreaView from react-native-safe-area-context
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/shared/theme';

interface Props {
  children: React.ReactNode;
}

export function ReviewScreen({ children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
});

import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { MText } from './MText';
import { colors, spacing, typography } from '@/shared/theme';

interface Props extends ViewProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Section({ title, subtitle, children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title ? (
            <MText weight="bold" style={styles.title}>
              {title}
            </MText>
          ) : null}
          {subtitle ? (
            <MText weight="regular" style={styles.subtitle}>
              {subtitle}
            </MText>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl + 4,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 20,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});

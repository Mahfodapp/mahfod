import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MText } from './MText';
import { colors, spacing, radius } from '@/shared/theme';

interface Props {
  title?: string;
  onPress?: () => void;
}

export function FloatingActionButton({ title = '+', onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <MText weight="regular" style={styles.text}>
        {title}
      </MText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 110,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  text: {
    color: colors.primary,
    fontSize: 32,
    marginTop: -2,
  },
});

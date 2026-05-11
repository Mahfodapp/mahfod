import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { MText } from './MText';
import { colors, radius, typography, Shadows } from '@/shared/theme';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function PrimaryButton({ title, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        style,
      ]}
    >
      <MText weight="bold" style={styles.text}>
        {title}
      </MText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    ...Shadows.glow,
    elevation: 8,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  text: {
    ...typography.body,
    color: colors.primary,
  },
});

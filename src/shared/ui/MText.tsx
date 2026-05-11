/**
 * MText — Mahfod branded Text component.
 *
 * Applies Cairo font by default across the entire app.
 * Drop-in replacement for React Native's <Text>.
 *
 * Usage:
 *   <MText>عادي</MText>
 *   <MText weight="bold" style={...}>عريض</MText>
 *
 * Weight map:
 *   regular  → Cairo_400Regular
 *   semi     → Cairo_600SemiBold
 *   bold     → Cairo_700Bold   (default for headings)
 *   extra    → Cairo_800ExtraBold
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

type Weight = 'regular' | 'semi' | 'bold' | 'extra';

const FONT_FAMILY: Record<Weight, string> = {
  regular: 'Cairo_400Regular',
  semi:    'Cairo_600SemiBold',
  bold:    'Cairo_700Bold',
  extra:   'Cairo_800ExtraBold',
};

interface MTextProps extends TextProps {
  weight?: Weight;
}

import { isArabicText } from '../utils/textDirection';

export function MText({ weight = 'regular', style, children, ...rest }: MTextProps) {
  // Explicitly detect if text is English to align left, otherwise default to right (RTL app)
  const isRTL = typeof children === 'string' ? isArabicText(children) : true;
  const alignStyle = isRTL ? { textAlign: 'right' as const } : { textAlign: 'left' as const };

  return (
    <Text
      {...rest}
      style={[
        { fontFamily: FONT_FAMILY[weight] },
        alignStyle,
        style
      ]}
    >
      {children}
    </Text>
  );
}

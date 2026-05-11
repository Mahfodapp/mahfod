/**
 * MahfodButton — spec §UI-Components
 *
 * Variants:
 *   primary  — lime bg (#c8f000), near-black text  — ALL primary CTAs
 *   secondary — dark bg, lime border + lime text    — secondary actions
 *   danger    — red bg (#ff4444), white text        — destructive actions
 *   ghost     — transparent bg, muted text          — tertiary / cancel
 *
 * Sizes: sm | md (default) | lg
 * Props: loading, disabled, leftIcon, rightIcon, fullWidth
 */
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { MText } from './MText';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

// ── Types ─────────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface MahfodButtonProps {
  label:       string;
  onPress:     () => void;
  variant?:    Variant;
  size?:       Size;
  disabled?:   boolean;
  loading?:    boolean;
  fullWidth?:  boolean;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  style?:      ViewStyle;
  textStyle?:  TextStyle;
}

// ── Variant configs ────────────────────────────────────────────────────────────
const VARIANT: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: {
    bg:   colors.accent,
    text: colors.bg,            // near-black text on lime bg
  },
  secondary: {
    bg:   colors.surface,
    text: colors.accent,
    border: colors.accent,
  },
  danger: {
    bg:   colors.danger,
    text: colors.white,
  },
  ghost: {
    bg:   colors.transparent,
    text: colors.textSecondary,
  },
};

// ── Size configs ────────────────────────────────────────────────────────────────
const SIZE: Record<Size, { py: number; px: number; font: number; iconGap: number }> = {
  sm: { py: 10, px: 16, font: 13, iconGap: 6  },
  md: { py: 16, px: 24, font: 15, iconGap: 8  },
  lg: { py: 20, px: 32, font: 17, iconGap: 10 },
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function MahfodButton({
  label,
  onPress,
  variant   = 'primary',
  size      = 'md',
  disabled  = false,
  loading   = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: MahfodButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const v = VARIANT[variant];
  const s = SIZE[size];

  const pressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  const isDisabled = disabled || loading;

  // Glow shadow for primary
  const glowShadow: ViewStyle =
    variant === 'primary' && !isDisabled
      ? {
          shadowColor:  colors.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.55,
          shadowRadius:  18,
          elevation:     8,
        }
      : variant === 'danger' && !isDisabled
      ? {
          shadowColor:  colors.danger,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius:  12,
          elevation:     6,
        }
      : {};

  return (
    <Animated.View
      style={[
        styles.wrapper,
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        activeOpacity={0.88}
        style={[
          styles.btn,
          {
            backgroundColor: v.bg,
            paddingVertical:  s.py,
            paddingHorizontal: s.px,
            borderWidth:   v.border ? 1.5 : 0,
            borderColor:   v.border ?? 'transparent',
            opacity:       isDisabled ? 0.45 : 1,
          },
          glowShadow,
          fullWidth && styles.fullWidth,
        ]}
      >
        {/* Right icon (RTL: displayed on visual right = logical start) */}
        {rightIcon && !loading && (
          <View style={{ marginLeft: s.iconGap }}>{rightIcon}</View>
        )}

        {/* Label */}
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? colors.bg : colors.accent}
          />
        ) : (
          <MText
            weight={size === 'sm' ? 'semi' : 'bold'}
            style={[
              styles.label,
              {
                color:      v.text,
                fontSize:   s.font,
              },
              textStyle,
            ]}
          >
            {label}
          </MText>
        )}

        {/* Left icon (RTL: displayed on visual left = logical end) */}
        {leftIcon && !loading && (
          <View style={{ marginRight: s.iconGap }}>{leftIcon}</View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  fullWidth: {
    width: '100%',
  },
  btn: {
    flexDirection:  'row',  // RTL: icons on correct sides
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   radius.full,    // pill shape — spec
    overflow:       'hidden',
  },
  label: {
    letterSpacing: 0.2,
  },
});

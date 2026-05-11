import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
} from 'react-native';
import { MText } from './MText';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(0.8);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(1);
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const containerStyle: ViewStyle[] = [
    styles.base,
    variant === 'primary'   && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'danger'    && styles.danger,
    variant === 'ghost'     && styles.ghost,
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
  ].filter(Boolean) as ViewStyle[];

  const textStyle = [
    styles.label,
    variant === 'primary'   && styles.labelPrimary,
    variant === 'secondary' && styles.labelSecondary,
    variant === 'danger'    && styles.labelDanger,
    variant === 'ghost'     && styles.labelGhost,
  ].filter(Boolean);

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={styles.pressableArea}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.primary : colors.accent} size="small" />
        ) : (
          <View style={styles.inner}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <MText weight="bold" style={textStyle}>{label}</MText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 9999,
    minHeight: 52,
    overflow: 'hidden',
  },
  pressableArea: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    marginLeft: 4,
  },

  // Variants
  primary: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  danger: {
    backgroundColor: 'rgba(255,115,81,0.12)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },

  // Labels
  label: {
    fontFamily: fonts.cairoBold,
    fontSize: 16,
    textAlign: 'center',
  },
  labelPrimary: {
    color: colors.primary,
    fontWeight: '700',
  },
  labelSecondary: {
    color: colors.accent,
  },
  labelDanger: {
    color: colors.error,
  },
  labelGhost: {
    color: colors.textSecondary,
  },
});

export default Button;

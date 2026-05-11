import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { MText } from './MText';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  interpolateColor 
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { isArabicText } from '../utils/textDirection';

interface InputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  minHeight?: number;
  error?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry = false,
  multiline = false,
  minHeight,
  error,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(focused || value.length > 0 ? 1 : 0, { duration: 200 });
  }, [focused, value]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.accent, colors.accent]
    );
    return {
      borderColor: error ? colors.error : borderColor,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: focusAnim.value * 0.3,
      shadowRadius: 8,
      elevation: focusAnim.value * 4,
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: focusAnim.value === 1 ? 0 : 2 },
      ],
      opacity: focusAnim.value === 1 ? 1 : 0.8,
      color: focusAnim.value === 1 ? colors.accent : colors.textSecondary,
    };
  });

  return (
    <View style={styles.container}>
      {label && (
        <Animated.Text style={[styles.label, animatedLabelStyle]}>
          {label}
        </Animated.Text>
      )}
      <Animated.View style={[styles.inputContainer, animatedBorderStyle]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={focused ? placeholder : ''}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlign={isArabicText(value || placeholder) ? 'right' : 'left'}
          style={[
            styles.input,
            multiline && { minHeight: minHeight ?? 120, textAlignVertical: 'top' },
            { textAlign: isArabicText(value || placeholder) ? 'right' : 'left' }
          ]}
          {...rest}
        />
      </Animated.View>
      {error ? <MText weight="regular" style={styles.errorText}>{error}</MText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: fonts.cairoSemi,
    fontSize: 13,
    marginBottom: 7,
  },
  inputContainer: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderRadius: 12,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.cairo,
    fontSize: 15,
    color: colors.textPrimary,
  },
  errorText: {
    fontFamily: fonts.cairo,
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
});

export default Input;

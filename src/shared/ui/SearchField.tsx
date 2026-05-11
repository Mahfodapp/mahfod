import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '@/shared/theme/colors';
import { isArabicText } from '@/shared/utils/textDirection';

interface Props {
  placeholder?: string;
  value?: string;
  onChangeText?: (value: string) => void;
}

export function SearchField({ placeholder, value, onChangeText }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { textAlign: isArabicText(value || placeholder) ? 'right' : 'left' }]}
        textAlign={isArabicText(value || placeholder) ? 'right' : 'left'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 28,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
  },
});

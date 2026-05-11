import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

interface Props {
  children: React.ReactNode;
}

export function ReadingSurface({ children }: Props) {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 26,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
});

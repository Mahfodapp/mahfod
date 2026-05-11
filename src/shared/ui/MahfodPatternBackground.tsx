import React from 'react';
import Svg, { Path, G, Defs, Pattern, Use } from 'react-native-svg';
import { colors, Theme } from '../theme';
import { StyleSheet, View, Image } from 'react-native';

/**
 * Subtle Islamic-style star tessellation over solid primary — matches legacy Mahfod screenshots
 * (dark field + geometric texture, not full-bleed photo backgrounds).
 */
export function MahfodPatternBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: Theme.colors.bg }]} pointerEvents="none">
      <Image
        source={require('../../../assets/images/islamic_pattern.png')}
        style={[StyleSheet.absoluteFill, { opacity: 0.15, width: '100%', height: '100%' }]}
        resizeMode="repeat"
      />
    </View>
  );
}

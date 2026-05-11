/**
 * IslamicPatternBg — repeating SVG geometric Islamic pattern
 *
 * Spec: 8% opacity on dark background (#0a0a0a)
 *
 * Pattern: 8-pointed star (كوكب / rub el hizb) tile, 80×80px, repeating.
 * Rendered via react-native-svg with a PatternContext repeat simulation
 * (RN SVG doesn't natively tile; we tile manually in a grid).
 *
 * Usage:
 *   <IslamicPatternBg />              ← absolute fill, 8% opacity
 *   <IslamicPatternBg opacity={0.05} tileSize={60} color="#c8f000" />
 */
import React from 'react';
import { View, StyleSheet, Image, type ViewStyle } from 'react-native';

interface IslamicPatternBgProps {
  /** Overall opacity of the pattern layer. Spec: 0.08 */
  opacity?: number;
  /** Extra style for the container View */
  style?: ViewStyle;
  /** If true, positions the pattern as absolute fill (default: true) */
  absolute?: boolean;
}

export default function IslamicPatternBg({
  opacity = 0.08,
  style,
  absolute = true,
}: IslamicPatternBgProps) {
  const containerStyle: ViewStyle = absolute
    ? {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        pointerEvents: 'none',
      }
    : {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
      };

  return (
    <View style={[containerStyle, style]} pointerEvents="none">
      <Image
        source={require('../../../assets/images/islamic_pattern.png')}
        style={[StyleSheet.absoluteFill, { opacity, width: '100%', height: '100%' }]}
        resizeMode="repeat"
      />
    </View>
  );
}

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

const BAR_COUNT = 15;

const WaveBar = ({ isActive }: { isActive: boolean }) => {
  const scale = useSharedValue(0.2);

  useEffect(() => {
    if (isActive) {
      // Create an infinite random pulsing animation on the UI thread
      scale.value = withRepeat(
        withSequence(
          withTiming(Math.random() * 0.8 + 0.3, { duration: 250 + Math.random() * 200 }),
          withTiming(0.2, { duration: 250 + Math.random() * 200 })
        ),
        -1, // Infinite
        true // Reverse
      );
    } else {
      scale.value = withTiming(0.2, { duration: 300 });
    }
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return <Animated.View style={[styles.bar, style]} />;
};

export default function AudioWaveform({ isActive }: { isActive: boolean }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveBar key={i} isActive={isActive} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 3,
  },
  bar: {
    width: 4,
    height: 40,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});

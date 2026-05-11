import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  delay?: number;
}

export function FadeInView({ children, delay = 0 }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 420 });
    translateY.value = withTiming(0, { duration: 420 });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={style}>
      {children}
    </Animated.View>
  );
}

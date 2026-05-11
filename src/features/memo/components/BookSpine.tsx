/**
 * BookSpine — renders a Memo as a real photographic book standing on a shelf.
 *
 * Uses `assets/book.png` (green leather binding) as the base image.
 * Title is overlaid vertically (rotated) in the center.
 * A colored stage dot sits at the bottom.
 *
 * Dimensions are computed from screen width so 4 books fill each shelf row
 * at a premium, readable size. Exported so LibraryShelfRow can match.
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MText } from '@/shared/ui/MText';
import { colors } from '@/shared/theme/colors';
import { Memo } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The book PNG asset (green leather spine)
const BOOK_IMG = require('../../../../assets/book.png');

interface Props {
  memo: Memo;
  onPress?: (memo: Memo) => void;
  onLongPress?: (memo: Memo) => void;
  index?: number;
}

const STAGE_DOT_COLOR: Record<string, string> = {
  LEARNING:  colors.stageLearning,
  REVISION: colors.stageReview,
  MASTERED:  colors.stageMastered,
};

export function BookSpine({ memo, onPress, onLongPress, index = 0 }: Props) {
  const translateY = useSharedValue(0);
  const scale      = useSharedValue(1);
  const dotColor   = STAGE_DOT_COLOR[memo.stage] ?? colors.textMuted;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handlePressIn = useCallback(() => {
    // Book jumps up off the shelf
    translateY.value = withSpring(-14, { damping: 10, stiffness: 280 });
    scale.value      = withSpring(1.04, { damping: 10, stiffness: 280 });
  }, [translateY, scale]);

  const handlePressOut = useCallback(() => {
    // Book drops back onto shelf with a tiny bounce
    translateY.value = withSpring(0, { damping: 14, stiffness: 320 });
    scale.value      = withSpring(1,  { damping: 14, stiffness: 320 });
  }, [translateY, scale]);

  return (
    <AnimatedPressable
      style={[styles.wrapper, animatedStyle]}
      onPress={() => onPress?.(memo)}
      onLongPress={() => onLongPress?.(memo)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={400}
    >
      {/* Real book image */}
      <Image source={BOOK_IMG} style={styles.bookImage} resizeMode="stretch" />

      {/* Rotated title overlay */}
      <View style={styles.titleOverlay} pointerEvents="none">
        <MText
          weight="semi"
          numberOfLines={3}
          style={styles.titleText}
        >
          {memo.title}
        </MText>
      </View>

      {/* Stage color dot at the bottom */}
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
    </AnimatedPressable>
  );
}

// ─── Responsive book dimensions ────────────────────────────────────────────
// 4 books per shelf row, with 16px horizontal padding on each side + 12px
// internal padding per side = ~56px total horizontal offset, divided evenly.
const { width: SCREEN_W } = Dimensions.get('window');
export const BOOK_W = Math.floor((SCREEN_W - 10) / 4);
export const BOOK_H = Math.floor(BOOK_W * 2.1); // ~1.5:1 spine aspect ratio (thicker, not longer)

const styles = StyleSheet.create({
  wrapper: {
    width: BOOK_W,
    height: BOOK_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bookImage: {
    position: 'absolute',
    top: 0,
    left: -14, // shift left to keep it centered while making it wider
    width: BOOK_W + 28, // stretch the image to be wider than the wrapper
    height: BOOK_H,
  },
  titleOverlay: {
    position: 'absolute',
    // center the rotated text block inside the book spine area
    top: 0,
    left: 0,
    width: BOOK_W +5,
    height: BOOK_H,
    alignItems: 'center',
    justifyContent: 'center',
    // rotate so text runs bottom-to-top like a real book spine
    transform: [{ rotate: '-90deg' }],
    paddingHorizontal: 6,
  },
  titleText: {
    color: colors.textPrimary,          // off-white — legible on dark green leather
    fontSize: 12,                        // minimum of scale (caption level)
    lineHeight: 18,
    textAlign: 'center',
    textShadowColor: colors.overlayHeavy,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    writingDirection: 'ltr',
  },
  dot: {
    position: 'absolute',
    bottom: 16,
    width: 8,
    height: 8,
    borderRadius: 999,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
});

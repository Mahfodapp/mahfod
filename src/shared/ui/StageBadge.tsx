import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MText } from './MText';
import { colors } from '../theme';

type MemoStage = 'LEARNING' | 'REVISION' | 'MASTERED';

interface StageBadgeProps {
  stage: MemoStage;
}

const STAGE_CONFIG: Record<MemoStage, { bg: string; text: string; label: string; border: string }> = {
  LEARNING: {
    bg: 'rgba(170,255,220,0.12)',
    text: colors.stageLearning,
    label: 'يُحفظ',
    border: 'rgba(170,255,220,0.25)',
  },
  REVISION: {
    bg:     colors.accentSoft,    // rgba(204,255,0,0.10)
    text:   colors.stageReview,
    label:  'مراجعة',
    border: colors.borderAccent,  // rgba(204,255,0,0.25)
  },
  MASTERED: {
    bg: 'rgba(0,237,180,0.12)',
    text: colors.stageMastered,
    label: 'محكم',
    border: 'rgba(0,237,180,0.25)',
  },
};

export function StageBadge({ stage }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage] ?? {
    bg: 'rgba(255,255,255,0.08)',
    text: colors.textPrimary,
    label: stage,
    border: 'rgba(255,255,255,0.12)',
  };

  // Only animate the REVISION stage — it has pending action
  const glowOpacity = useSharedValue(1);

  useEffect(() => {
    if (stage === 'REVISION') {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = 1;
    }
  }, [stage]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    borderWidth: 1,
    borderColor: config.border,
    backgroundColor: config.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MText weight="bold" style={[styles.text, { color: config.text }]}>
        {config.label}
      </MText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,  // caption level — MText applies fonts.bold via weight prop
  },
});

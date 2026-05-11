/**
 * StatsCounter — Premium inline counter with animated number reveal.
 *
 * Compact single-card horizontal layout. Same footprint as original.
 * The accent stat (التكرارات) gets a filled lime pill background.
 * Numbers count up with overshoot spring + brief scale-pulse on land.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MText } from '@/shared/ui/MText';
import IslamicPatternBg from '@/shared/ui/IslamicPatternBg';
import { colors, spacing, radius, typography, fonts } from '@/shared/theme';
import { useMemoStore } from '../store/memo.store';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stat {
  label: string;
  value: number;
  accent?: boolean;
}

// ─── CountUp — visible counting number with overshoot pulse ──────────────────
function CountUp({
  target,
  delay,
  accent,
}: {
  target: number;
  delay: number;
  accent?: boolean;
}) {
  const sv = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [val, setVal] = React.useState(0);

  useEffect(() => {
    sv.value = 0;
    setVal(0);
    sv.value = withDelay(
      delay,
      withTiming(target, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
    // scale-pulse when landing
    pulse.value = withDelay(
      delay + 850,
      withSequence(
        withSpring(1.12, { damping: 6, stiffness: 300 }),
        withSpring(1,    { damping: 10, stiffness: 200 }),
      ),
    );
  }, [target]);

  useEffect(() => {
    const id = setInterval(() => {
      const v = Math.round(sv.value);
      setVal(v);
      if (v >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={pulseStyle}>
      <MText
        weight="extra"
        style={[
          styles.value,
          accent ? styles.valueAccentText : styles.valueNormal,
        ]}
      >
        {val.toString()}
      </MText>
    </Animated.View>
  );
}

// ─── StatColumn ──────────────────────────────────────────────────────────────
function StatColumn({ stat, index }: { stat: Stat; index: number }) {
  const d = 60 + index * 90;
  const op = useSharedValue(0);
  const ty = useSharedValue(14);

  useEffect(() => {
    op.value = withDelay(d, withSpring(1, { damping: 22, stiffness: 200 }));
    ty.value = withDelay(d, withSpring(0, { damping: 18, stiffness: 170 }));
  }, []);

  const colAnim = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.col, colAnim]}>
      {/* Accent pill background */}
      {stat.accent && <View style={styles.accentPill} />}

      <CountUp target={stat.value} delay={d + 60} accent={stat.accent} />
      <MText weight="semi" style={[styles.label, stat.accent && styles.labelAccent]}>
        {stat.label}
      </MText>
    </Animated.View>
  );
}

// ─── StatsCounter (main) ─────────────────────────────────────────────────────
export function StatsCounter() {
  const memos = useMemoStore(s => s.memos);

  const stats: Stat[] = [
    { label: 'المحفوظات', value: memos.length },
    {
      label: 'التكرارات',
      value: memos.reduce((a, m) => a + (m.repetition_count ?? 0) + (m.review_count ?? 0), 0),
      accent: true,
    },
    { label: 'المراجعات', value: memos.filter(m => m.stage === 'REVISION').length },
    { label: 'المحكمات',  value: memos.filter(m => m.stage === 'MASTERED').length },
  ];

  // Card entrance
  const cardOp = useSharedValue(0);
  const cardSc = useSharedValue(0.97);
  useEffect(() => {
    cardOp.value = withSpring(1, { damping: 24, stiffness: 160 });
    cardSc.value = withSpring(1, { damping: 22, stiffness: 180 });
  }, []);

  const cardAnim = useAnimatedStyle(() => ({
    opacity: cardOp.value,
    transform: [{ scale: cardSc.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, cardAnim]}>
      <View style={styles.card}>
        <IslamicPatternBg opacity={0.06} absolute />

        {/* Top accent line */}
        <View style={styles.topLine} />

        {/* Header */}
        <MText weight="semi" style={styles.header}>إحصائياتك</MText>

        {/* Stats row */}
        <View style={styles.row}>
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <StatColumn stat={stat} index={i} />
              {i < stats.length - 1 && <View style={styles.sep} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },

  // Thin lime accent at top
  topLine: {
    position: 'absolute',
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    opacity: 0.55,
  },

  header: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.4,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  col: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },

  // Lime pill behind accent stat
  accentPill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },

  // Numbers
  value: {
    fontFamily: fonts.extra,
    fontSize: 30,
    lineHeight: 36,
    zIndex: 1,
  },
  valueNormal: {
    color: colors.textPrimary,
  },
  valueAccentText: {
    color: colors.accent,
    textShadowColor: 'rgba(204,255,0,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Labels
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    zIndex: 1,
  },
  labelAccent: {
    color: colors.accent,
    opacity: 0.7,
  },

  // Vertical separator
  sep: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
  },
});

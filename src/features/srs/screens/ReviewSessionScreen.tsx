/**
 * ReviewSessionScreen — daily revision session.
 *
 * Renders differently based on settings.revision_mode:
 *
 *  'fixed' → Rep-counter flow.
 *            Bottom CTA: كررت (N / revision_reps).
 *            No rating. Pure daily-cadence.
 *
 *  'sm2'   → Reveal-then-rate flow.
 *            Step 1: user reads memo → taps "قرأت" (read it).
 *            Step 2: rating bar slides up:
 *                    [نسيت · صعب · حسناً · سهل]
 *            Rating feeds applyRevision() → SM-2 computes next interval.
 *
 * Rules:
 * - <MText> only, no raw <Text>
 * - colors.* / typography.* / spacing.* / radius.*
 * - Reanimated + MotiView — no RN Animated
 * - applyRevision() from revisionEngine.ts
 * - RTL: row, textAlign:'right'
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import { useMemoStore } from '../../memo/store/memo.store';
import { useSettingsStore } from '../../settings/store/settings.store';
import { applyRevision } from '../logic/revisionEngine';
import { Star, X, Eye, Info } from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp   = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'ReviewSessionScreen'>;
type Quality   = 0 | 1 | 2 | 3;

// ─── Rating config (SM-2 mode) ────────────────────────────────────────────────

const RATINGS: { quality: Quality; label: string; color: string; bg: string }[] = [
  { quality: 0, label: 'نسيت',  color: colors.error,        bg: colors.errorSoft },
  { quality: 1, label: 'صعب',   color: colors.warning,      bg: colors.warningSoft },
  { quality: 2, label: 'حسناً', color: colors.stageReview,  bg: colors.accentSoft },
  { quality: 3, label: 'سهل',   color: colors.success,      bg: colors.successSoft },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReviewSessionScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteType>();
  const memoId     = route.params?.memoId;

  const { memos, fetchMemos, updateMemo } = useMemoStore();
  const { settings } = useSettingsStore();

  const mode        = settings.revision_mode ?? 'fixed';
  const sessionReps = settings.session_reps   ?? 5;   // reps per session (كررت N/M)

  // ── Queue: store IDs only, resolve live memo from store at render time ──────
  // Matches the LearningSession pattern — prevents stale-snapshot bugs.

  const [queueIds, setQueueIds] = useState<string[]>(() => {
    if (memoId) {
      const single = memos.find(m => m.id === memoId && m.stage === 'REVISION');
      return single ? [single.id] : [];
    }
    const now = new Date();
    return memos
      .filter(m => m.stage === 'REVISION' && (!m.next_review_at || new Date(m.next_review_at) <= now))
      .map(m => m.id);
  });

  const [index,    setIndex]    = useState(0);
  const [reps,     setReps]     = useState(0);      // fixed mode: taps on current memo
  const [fontSize, setFontSize] = useState(18);
  const [revealed, setRevealed] = useState(false);  // sm2: has user signaled they read it?
  const [done,     setDone]     = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => { if (memos.length === 0) fetchMemos(); }, [fetchMemos]);
  useEffect(() => {
    if (!memoId && memos.length > 0 && queueIds.length === 0) {
      const now = new Date();
      setQueueIds(
        memos
          .filter(m => m.stage === 'REVISION' && (!m.next_review_at || new Date(m.next_review_at) <= now))
          .map(m => m.id)
      );
    }
  }, [memos, memoId, queueIds.length]);

  // Live memo — always freshest data from store
  const currentId = queueIds[index];
  const memo      = memos.find(m => m.id === currentId);

  // ── Animated progress bar ──────────────────────────────────────────────────

  const progressAnim = useSharedValue(0);
  useEffect(() => {
    const pct = queueIds.length > 0 ? (index + 1) / queueIds.length : 0;
    progressAnim.value = withTiming(pct, { duration: 400 });
  }, [index, queueIds.length]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressAnim.value * 100}%` }));

  // ── Card entrance ─────────────────────────────────────────────────────────

  const cardSlide   = useSharedValue(40);
  const cardOpacity = useSharedValue(0);
  const cardStyle   = useAnimatedStyle(() => ({
    transform: [{ translateY: cardSlide.value }],
    opacity:    cardOpacity.value,
  }));
  const animateCardIn = useCallback(() => {
    cardSlide.value   = 40;
    cardOpacity.value = 0;
    cardSlide.value   = withSpring(0, { damping: 14, stiffness: 160 });
    cardOpacity.value = withTiming(1, { duration: 300 });
  }, []);
  useEffect(() => { animateCardIn(); }, [index]);

  // SM-2 rating bar slide-up
  const ratingY = useSharedValue(80);
  const ratingO = useSharedValue(0);
  const ratingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ratingY.value }],
    opacity:    ratingO.value,
  }));
  const showRatingBar = useCallback(() => {
    ratingY.value = withSpring(0, { damping: 16, stiffness: 220 });
    ratingO.value = withTiming(1, { duration: 250 });
  }, []);

  // ── Advance to next memo ───────────────────────────────────────────────────

  const advance = useCallback(() => {
    setReps(0);
    setRevealed(false);
    ratingY.value = 80;
    ratingO.value = 0;
    if (index + 1 >= queueIds.length) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
      animateCardIn();
    }
  }, [index, queueIds.length, animateCardIn]);

  // ── Fixed-mode handler ────────────────────────────────────────────────────

  const handleRepeat = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!memo) return;
    const newReps = reps + 1;
    setReps(newReps);

    if (newReps >= sessionReps) {
      const result = applyRevision(memo, null, settings);
      await updateMemo(memo.id, {
        review_count:     result.review_count,
        next_review_at:   result.next_review_at,
        last_reviewed_at: result.last_reviewed_at,
        stage:            result.stage,
        ease_factor:      result.ease_factor,
        interval_days:    result.interval_days,
      });
      advance();
    }
  }, [reps, memo, settings, sessionReps, updateMemo, advance]);

  // ── SM-2 "I've read it" handler ───────────────────────────────────────────

  const handleRevealed = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRevealed(true);
    showRatingBar();
  }, [showRatingBar]);

  // ── SM-2 rating handler ───────────────────────────────────────────────────

  const handleRate = useCallback(async (quality: Quality) => {
    if (!memo) return;
    Haptics.notificationAsync(
      quality >= 2
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
    const result = applyRevision(memo, quality, settings);
    await updateMemo(memo.id, {
      review_count:     result.review_count,
      next_review_at:   result.next_review_at,
      last_reviewed_at: result.last_reviewed_at,
      stage:            result.stage,
      // Persist SM-2 state so easeFactor evolves correctly session-to-session
      ease_factor:      result.ease_factor,
      interval_days:    result.interval_days,
    });
    advance();
  }, [memo, settings, updateMemo, advance]);

  const handleFavorite = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (memo) updateMemo(memo.id, { is_favorite: !memo.is_favorite });
  }, [memo, updateMemo]);

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // ── Empty state ────────────────────────────────────────────────────────────

  if (queueIds.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top','left','right']}>
        <MahfodPatternBackground />
        <View style={styles.centerState}>
          <Star size={56} color={colors.accent} strokeWidth={1.5} />
          <MText weight="bold"    style={styles.doneTitle}>لا توجد مراجعات اليوم</MText>
          <MText weight="regular" style={styles.doneSub}>عُد غداً لمواصلة المراجعة</MText>
          <TouchableOpacity onPress={handleCancel} style={styles.doneBtn}>
            <MText weight="semi" style={styles.doneBtnText}>العودة</MText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Done state ─────────────────────────────────────────────────────────────

  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={['top','left','right']}>
        <MahfodPatternBackground />
        <View style={styles.centerState}>
          <MotiView
            from={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <Star size={72} color={colors.accent} fill={colors.accent} strokeWidth={1.2} />
          </MotiView>
          <MText weight="extra"   style={styles.doneTitle}>أحسنت!</MText>
          <MText weight="regular" style={styles.doneSub}>
            انتهت جلسة المراجعة — {queueIds.length} محفوظ
          </MText>
          <TouchableOpacity onPress={handleCancel} style={styles.doneBtn}>
            <MText weight="bold" style={styles.doneBtnText}>العودة للرئيسية</MText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Active session ─────────────────────────────────────────────────────────
  // `memo` is already declared on line 114 — live from store, no snapshot needed
  const isFav     = memo?.is_favorite ?? false;
  const reviewDay = (memo?.review_count ?? 0) + 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <MahfodPatternBackground />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleFavorite}
          style={styles.headerIconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Star
            size={20}
            color={isFav ? colors.accent : colors.textMuted}
            fill={isFav ? colors.accent : 'transparent'}
            strokeWidth={1.8}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <MText weight="bold"    style={styles.headerTitle}>المراجعة اليومية</MText>
          <MText weight="regular" style={styles.headerCount}>
            {index + 1} / {queueIds.length}
            {mode === 'sm2' && (
              <MText weight="regular" style={styles.modeBadge}> · SM-2</MText>
            )}
          </MText>
        </View>

        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
          <X size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Lime progress bar ────────────────────────────────────────────── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* ── Memo title + progress label ── */}
        <MotiView
          key={`title-${index}`}
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          <MText weight="extra" style={styles.memoTitle} numberOfLines={2}>
            {memo.title}
          </MText>
          <MText weight="regular" style={styles.memoSubtitle}>
            {mode === 'fixed'
              ? `مراجعة اليوم ${reviewDay} / ${settings.revision_reps ?? 30}`
              : `جلسة ${reviewDay}`
            }
          </MText>
        </MotiView>

        {/* ── Hint card (mode-aware, dismissible) ── */}
        {!hintDismissed && (
          <MotiView
            from={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14 }}
            style={styles.hintCard}
          >
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHintDismissed(true); }}
              style={styles.hintClose}
              hitSlop={8}
            >
              <X size={14} color={colors.textMuted} />
            </TouchableOpacity>
            <Info size={15} color={colors.accent} style={{ marginLeft: spacing.xs }} />
            <MText weight="regular" style={styles.hintText}>
              {mode === 'fixed'
                ? `كرر هذا المحفوظ ${sessionReps} مرة لترسيخه في الذاكرة.`
                : 'اقرأ النص ثم قيّم مستوى تذكرك — سيحسب النظام الموعد التالي تلقائياً.'
              }
            </MText>
          </MotiView>
        )}

        {/* ── Font size controls ── */}
        <View style={styles.fontControls}>
          <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(f => Math.max(12, f - 2))}>
            <MText weight="semi" style={[styles.fontBtnText, { fontSize: 13 }]}>أ-</MText>
          </TouchableOpacity>
          <View style={styles.fontSizeDisplay}>
            <MText weight="semi" style={styles.fontSizeText}>{fontSize}</MText>
          </View>
          <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(f => Math.min(32, f + 2))}>
            <MText weight="semi" style={[styles.fontBtnText, { fontSize: 18 }]}>أ+</MText>
          </TouchableOpacity>
        </View>

        {/* ── Main text card ── */}
        <Animated.View style={[styles.textCard, cardStyle]}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image
              source={require('../../../../assets/images/islamic_pattern.png')}
              style={StyleSheet.absoluteFill}
              resizeMode="repeat"
              fadeDuration={0}
            />
          </View>

          {memo.is_poem ? (
            <View style={styles.poemWrap}>
              <MText weight="bold" style={[styles.memoText, { fontSize }]}>
                {memo.text.split('***')[0]?.trim()}
              </MText>
              <View style={styles.poemDivider} />
              <MText weight="bold" style={[styles.memoText, { fontSize }]}>
                {memo.text.split('***')[1]?.trim()}
              </MText>
            </View>
          ) : (
            <MText weight="bold" style={[styles.memoText, { fontSize }]}>
              {memo.text}
            </MText>
          )}
        </Animated.View>

        {/* ── Dot progress indicator ── */}
        <View style={styles.dotsRow}>
          {queueIds.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index && styles.dotActive,
                i < index  && styles.dotDone,
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════
          FIXED MODE FOOTER
          ══════════════════════════════════════════════════════════════════ */}
      {mode === 'fixed' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleRepeat}
            activeOpacity={0.85}
          >
            <MText weight="bold" style={styles.ctaBtnText}>
              كررت ({reps}/{sessionReps})
            </MText>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SM-2 MODE FOOTER
          ══════════════════════════════════════════════════════════════════ */}
      {mode === 'sm2' && (
        <View style={styles.footer}>
          {!revealed ? (
            /* Step 1: user hasn't tapped "قرأت" yet */
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={handleRevealed}
              activeOpacity={0.85}
            >
              <Eye size={20} color={colors.primary} />
              <MText weight="bold" style={styles.ctaBtnText}> قرأت</MText>
            </TouchableOpacity>
          ) : (
            /* Step 2: rating bar slides in */
            <Animated.View style={[styles.ratingRow, ratingStyle]}>
              {RATINGS.map(r => (
                <TouchableOpacity
                  key={r.quality}
                  style={[styles.ratingBtn, { backgroundColor: r.bg, borderColor: r.color }]}
                  onPress={() => handleRate(r.quality)}
                  activeOpacity={0.78}
                >
                  <MText weight="bold" style={[styles.ratingLabel, { color: r.color }]}>
                    {r.label}
                  </MText>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  modeBadge: {
    ...typography.caption,
    color: colors.accent,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Progress bar ─────────────────────────────────────────────────────
  progressTrack: {
    height: 3,
    backgroundColor: colors.surfaceHigh,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 99,
  },

  // ── Scroll ──────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: 140,
    gap: spacing.md,
  },

  // ── Memo title ────────────────────────────────────────────────────────
  memoTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  memoSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ── Hint card ─────────────────────────────────────────────────────────
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    gap: spacing.xs,
  },
  hintClose: {
    marginLeft: 'auto',
    padding: 2,
  },
  hintText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'left',
    lineHeight: 22,
  },

  // ── Font controls ─────────────────────────────────────────────────────
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fontBtn: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontBtnText: {
    color: colors.textPrimary,
  },
  fontSizeDisplay: {
    paddingHorizontal: spacing.sm,
  },
  fontSizeText: {
    ...typography.label,
    color: colors.textMuted,
  },

  // ── Text card ─────────────────────────────────────────────────────────
  textCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...Shadows.deep,
  },
  memoText: {
    fontFamily: fonts.bold,
    color: colors.accent,
    textAlign: 'center',
    lineHeight: 40,
    writingDirection: 'ltr',
  },
  poemWrap: {
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  poemDivider: {
    height: 1,
    width: '40%',
    backgroundColor: colors.border,
  },

  // ── Dot indicators ────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceBright,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: colors.accentDim,
    opacity: 0.6,
  },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: 16,
    ...Shadows.glow,
    elevation: 8,
  },
  ctaBtnText: {
    ...typography.h3,
    color: colors.primary,
  },

  // ── SM-2 rating row ───────────────────────────────────────────────────
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ratingBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  ratingLabel: {
    ...typography.h3,
  },

  // ── Done / Empty states ───────────────────────────────────────────────
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  doneTitle: {
    ...typography.h1,
    color: colors.accent,
    textAlign: 'center',
  },
  doneSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  doneBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    ...Shadows.glow,
    elevation: 8,
  },
  doneBtnText: {
    ...typography.h3,
    color: colors.primary,
  },
});

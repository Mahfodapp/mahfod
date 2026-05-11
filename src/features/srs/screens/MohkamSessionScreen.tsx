/**
 * MohkamSessionScreen — Mohkam (mastered) review session.
 *
 * Tests the user's retention of mastered memos using a card-flip mechanic.
 *
 * Rules:
 * - <MText> always, no raw <Text>
 * - colors.* / typography.* / fonts.* / spacing.* / radius.*
 * - Reanimated for animations — no RN Animated API
 * - RTL: row, textAlign:'right'
 * - Haptics on every interactive press
 * - Uses useMemoStore (not raw memoService) to keep Zustand state in sync
 * - Uses addDays from revisionEngine (no invented scheduling logic)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useMemoStore } from '../../memo/store/memo.store';
import { useSettingsStore } from '../../settings/store/settings.store';
import { addDays } from '../logic/revisionEngine';
import { X, Eye, Check, XCircle, Award, Star } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function MohkamSessionScreen() {
  const navigation = useNavigation<NavProp>();

  // ── Store (correct pattern — not raw memoService) ──────────────────────────
  const { memos, fetchMemos, updateMemo } = useMemoStore();
  const { settings } = useSettingsStore();

  // ── Queue: IDs of MASTERED memos (shuffled, capped at 10) ─────────────────
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const [rememberedCount, setRememberedCount] = useState(0);
  const [forgotCount, setForgotCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        if (memos.length === 0) await fetchMemos();
        // Build shuffled queue of MASTERED memo IDs, capped at 10
        const masterIds = memos
          .filter(m => m.stage === 'MASTERED' && !m.deleted)
          .map(m => m.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 10);
        setQueueIds(masterIds);
        if (masterIds.length === 0) setSessionComplete(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch after store update if empty
  useEffect(() => {
    if (!loading && queueIds.length === 0 && memos.length > 0) {
      const masterIds = memos
        .filter(m => m.stage === 'MASTERED' && !m.deleted)
        .map(m => m.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
      setQueueIds(masterIds);
      if (masterIds.length === 0) setSessionComplete(true);
    }
  }, [memos, loading, queueIds.length]);

  // Live memo — always freshest data from the store
  const currentId = queueIds[currentIndex];
  const memo = memos.find(m => m.id === currentId);

  const handleExit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('إنهاء', 'هل تريد إنهاء جلسة المحكم؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }, [navigation]);

  const flip = useSharedValue(0);

  const handleReveal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRevealed(true);
    flip.value = withTiming(1, { duration: 600 });
  }, [flip]);

  const advance = useCallback(() => {
    setIsRevealed(false);
    flip.value = 0;
    if (currentIndex + 1 >= queueIds.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, queueIds.length, flip]);

  const handleRemembered = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRememberedCount(prev => prev + 1);
    advance();
  }, [advance]);

  const handleForgot = useCallback(async () => {
    if (!memo) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setForgotCount(prev => prev + 1);

    // Demote to REVISION and schedule for tomorrow.
    // Preserve review progress — don't reset to 0.
    // Subtract reinforce_reps so they need a few more sessions to re-master.
    const reinforceReps = settings.reinforce_reps ?? 5;
    const revisedCount  = Math.max(0, (memo.review_count ?? 0) - reinforceReps);

    await updateMemo(memo.id, {
      stage:          'REVISION',
      review_count:   revisedCount,
      next_review_at: addDays(new Date(), 1).toISOString(),
    });

    advance();
  }, [memo, settings.reinforce_reps, updateMemo, advance]);

  const frontStyle = useAnimatedStyle(() => {
    const spin = flip.value * 180;
    return {
      transform: [{ rotateY: `${spin}deg` }],  // rotateY is more reliable on Android
      backfaceVisibility: 'hidden',
      opacity: flip.value < 0.5 ? 1 : 0,
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const spin = flip.value * 180 + 180;
    return {
      transform: [{ rotateY: `${spin}deg` }],  // rotateY is more reliable on Android
      backfaceVisibility: 'hidden',
      opacity: flip.value >= 0.5 ? 1 : 0,
      justifyContent: 'center',
    };
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <MahfodPatternBackground />
        <View style={styles.centerState}>
          <MText weight="regular" style={styles.loadingText}>جاري التحميل...</MText>
        </View>
      </SafeAreaView>
    );
  }

  // ── Session complete / empty ─────────────────────────────────────────────
  if (sessionComplete) {
    if (queueIds.length === 0) {
      return (
        <SafeAreaView style={styles.container}>
          <MahfodPatternBackground />
          <View style={styles.centerState}>
            <MotiView
              from={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <Award color={colors.accent} size={64} />
            </MotiView>
            <MText weight="bold" style={styles.emptyTitle}>لا توجد محفوظات محكمة حالياً</MText>
            <MText weight="regular" style={styles.emptySub}>أكمل مراجعة محفوظاتك لترقيتها إلى محكمة</MText>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MText weight="bold" style={styles.backBtnText}>العودة</MText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <MahfodPatternBackground />
        <View style={styles.centerState}>
          <MotiView
            from={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <Star color={colors.accent} fill={colors.accent} size={72} strokeWidth={1.2} />
          </MotiView>
          <MText weight="extra" style={styles.doneTitle}>أحسنت!</MText>
          <MText weight="regular" style={styles.doneSub}>انتهت جلسة المحكم</MText>

          {/* Stats row */}
          <View style={styles.doneStatsRow}>
            <View style={styles.doneStat}>
              <MText weight="bold" style={styles.doneStatValue}>{rememberedCount}</MText>
              <MText weight="regular" style={styles.doneStatLabel}>تذكرت</MText>
            </View>
            <View style={styles.doneStatDivider} />
            <View style={styles.doneStat}>
              <MText weight="bold" style={[styles.doneStatValue, { color: colors.error }]}>{forgotCount}</MText>
              <MText weight="regular" style={styles.doneStatLabel}>نسيت</MText>
            </View>
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MText weight="bold" style={styles.backBtnText}>العودة للرئيسية</MText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Guard: memo not yet in store
  if (!memo) {
    return (
      <SafeAreaView style={styles.container}>
        <MahfodPatternBackground />
        <View style={styles.centerState}>
          <MText weight="regular" style={styles.loadingText}>جاري التحميل...</MText>
        </View>
      </SafeAreaView>
    );
  }

  // ── Active session ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <MahfodPatternBackground />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ width: spacing.xl }} />
        <View style={styles.headerCenter}>
          <MText weight="bold" style={styles.headerTitle}>جلسة المحكم</MText>
          <MText weight="regular" style={styles.headerSubtitle}>اختبار المحفوظات المحكمة</MText>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleExit}>
          <X color={colors.textPrimary} size={20} />
        </TouchableOpacity>
      </View>

      {/* ── Progress — current/total (fixed: was reversed) ── */}
      <MText weight="regular" style={styles.progressText}>
        {currentIndex + 1} / {queueIds.length}
      </MText>

      {/* ── Content ── */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <MotiView
          key={`title-${currentIndex}`}
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          <MText weight="extra" style={styles.memoTitle}>{memo.title}</MText>
        </MotiView>

        <View style={styles.memoCard}>
          <Animated.View style={frontStyle} pointerEvents={isRevealed ? 'none' : 'auto'}>
            <View style={styles.hiddenState}>
              <MText weight="regular" style={styles.hiddenText}>▬▬▬▬▬▬▬▬▬▬▬</MText>
              <MText weight="regular" style={styles.hiddenText}>▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬</MText>
              <MText weight="regular" style={styles.hiddenText}>▬▬▬▬▬▬▬▬▬▬</MText>
            </View>
          </Animated.View>

          <Animated.View style={backStyle} pointerEvents={!isRevealed ? 'none' : 'auto'}>
            {memo.is_poem ? (
              <View>
                <MText weight="bold" style={styles.revealedText}>
                  {memo.text.split('***')[0]?.trim()}
                </MText>
                <View style={styles.poemDivider} />
                <MText weight="bold" style={styles.revealedText}>
                  {memo.text.split('***')[1]?.trim()}
                </MText>
              </View>
            ) : (
              <MText weight="bold" style={styles.revealedText}>{memo.text}</MText>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* ── Bottom actions ── */}
      <View style={styles.bottomArea}>
        {!isRevealed ? (
          <TouchableOpacity style={styles.revealBtn} onPress={handleReveal} activeOpacity={0.85}>
            <Eye color={colors.accent} size={20} />
            <MText weight="bold" style={styles.revealBtnText}>إظهار النص</MText>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.successBtn} onPress={handleRemembered} activeOpacity={0.85}>
              <Check color={colors.success} size={24} />
              <MText weight="bold" style={styles.successBtnText}>تذكرت</MText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerBtn} onPress={handleForgot} activeOpacity={0.85}>
              <XCircle color={colors.error} size={24} />
              <MText weight="bold" style={styles.dangerBtnText}>لم أتذكر</MText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Center state (loading/empty/done)
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Done state
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
  doneStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  doneStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  doneStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  doneStatValue: {
    ...typography.h2,
    color: colors.success,
  },
  doneStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  backBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    ...Shadows.glow,
    elevation: 8,
  },
  backBtnText: {
    ...typography.h3,
    color: colors.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Progress — correctly shows current/total
  progressText: {
    textAlign: 'center',
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Content
  scroll: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  memoTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  memoCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    padding: spacing.lg,
    minHeight: 250,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
    ...Shadows.card,
  },
  hiddenState: {
    alignItems: 'center',
    gap: spacing.md,
  },
  hiddenText: {
    color: colors.border,
    ...typography.h2,
    fontFamily: fonts.regular,
  },
  revealedText: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    writingDirection: 'ltr',
  },
  poemDivider: {
    height: 1,
    backgroundColor: colors.border,
    width: '40%',
    alignSelf: 'center',
    marginVertical: spacing.md,
  },

  // Bottom area
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHigh,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  revealBtnText: {
    ...typography.body,
    color: colors.accent,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  successBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  successBtnText: {
    ...typography.h3,
    color: colors.success,
  },
  dangerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dangerBtnText: {
    ...typography.h3,
    color: colors.error,
  },
});

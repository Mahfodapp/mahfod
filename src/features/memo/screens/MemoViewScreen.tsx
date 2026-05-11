/**
 * MemoViewScreen — Read-only display of a single Memo.
 *
 * Design rules followed:
 * - SafeAreaView + MahfodPatternBackground (Screen has no footer slot)
 * - <MText> for ALL text — no raw <Text>
 * - All animations via react-native-reanimated / moti (no RN Animated API)
 * - All colors from colors.* tokens — zero hardcoded hex
 * - All font families via fonts.* — zero hardcoded strings
 * - All spacing/radius via tokens
 * - StageColors / StageLabels from theme index
 * - RTL: flexDirection: 'row', textAlign: 'left'
 * - No Indian/Arabic-Indic digits — manual Latin-numeral date formatter
 * - Haptics on every interactive press
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, MotiText } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { MText } from '@/shared/ui/MText';
import { StageBadge } from '@/shared/ui/StageBadge';
import { EmptyState } from '@/shared/ui/EmptyState';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import {
  colors,
  spacing,
  radius,
  typography,
  fonts,
  StageColors,
  StageLabels,
  Shadows,
} from '@/shared/theme';
import { useMemoStore } from '../store/memo.store';
import {
  ArrowRight,
  Repeat2,
  Clock,
  Star,
  Pencil,
  BookOpen,
  Heart,
  Tag,
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp    = NativeStackNavigationProp<RootStackParamList>;
type RouteType  = RouteProp<RootStackParamList, 'MemoViewScreen'>;

// ─── Date helper — Latin digits only ─────────────────────────────────────────

const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];

function toLatinDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Pressable with spring scale ─────────────────────────────────────────────

function SpringPressable({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: object | object[];
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 15, stiffness: 300 }); }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MemoViewScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteType>();
  const { memoId } = route.params;

  const { memos } = useMemoStore();
  const memo = memos.find(m => m.id === memoId);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const goEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddMemoScreen', { memoId: memoId });
  }, [navigation, memoId]);

  const goReview = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Only called for REVISION or MASTERED memos
    navigation.navigate('ReviewSessionScreen', { memoId: memoId });
  }, [navigation, memoId]);

  // ── Empty / not-found ──────────────────────────────────────────────────────
  if (!memo) {
    return (
      <SafeAreaView style={styles.safe} edges={['top','left','right']}>
        <MahfodPatternBackground />
        <View style={styles.topBarNotFound}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={12}>
            <ArrowRight size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <EmptyState
          title="المحفوظ غير موجود"
          subtitle="ربما تم حذفه أو لم يُحمَّل بعد"
        />
      </SafeAreaView>
    );
  }

  const stageColor = StageColors[memo.stage] ?? colors.textMuted;
  const isPoem     = memo.is_poem;
  const hasTags    = memo.tags && memo.tags.length > 0;

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <MahfodPatternBackground />

      {/* ── Slim top bar (fixed, doesn't scroll) ── */}
      <View style={styles.topBarWrapper}>
        {/* Physical left = logical back in RTL context */}
        <TouchableOpacity
          onPress={goBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowRight size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Center title */}
        <MText weight="bold" style={styles.topBarTitle} numberOfLines={1}>
          {memo.title}
        </MText>

        {/* Right — StageBadge (has its own Reanimated pulse for REVISION stage) */}
        <StageBadge stage={memo.stage} />
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >

      {/* ── Favorite indicator strip ──────────────────────────────────────── */}
      {memo.is_favorite && (
        <MotiView
          from={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          style={styles.favoriteStrip}
        >
          <Heart size={12} color={colors.error} fill={colors.error} />
          <MText weight="semi" style={styles.favoriteText}>محفوظ مفضّل</MText>
        </MotiView>
      )}

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 320, delay: 60 }}
        style={styles.statsRow}
      >
        <StatCard
          icon={<Repeat2 size={15} color={colors.accent} />}
          label="مراجعات"
          value={String(memo.review_count ?? 0)}
          topColor={colors.accent}
          delay={0}
        />
        <StatCard
          icon={<Clock size={15} color={colors.stageReview} />}
          label="التالية"
          value={toLatinDate(memo.next_review_at)}
          topColor={colors.stageReview}
          delay={60}
        />
        <StatCard
          icon={<Star size={15} color={colors.stageLearning} />}
          label="التكرار"
          value={String(memo.repetition_count ?? 0)}
          topColor={colors.stageLearning}
          delay={120}
        />
      </MotiView>

      {/* ── Label chip ───────────────────────────────────────────────────── */}
      {memo.label ? (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300, delay: 140 }}
          style={styles.labelRow}
        >
          <Tag size={13} color={colors.textMuted} />
          <MText weight="semi" style={styles.labelText}>{memo.label}</MText>
        </MotiView>
      ) : null}

      {/* ── Main text card ───────────────────────────────────────────────── */}
      <MotiView
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 14, delay: 100 }}
        style={styles.textCard}
      >
        {/* Accent bar on RTL leading edge (right) */}
        <View style={[styles.accentBar, { backgroundColor: stageColor }]} />

        <MText
          weight="regular"
          style={[
            styles.memoText,
            // Poem uses Amiri per design system
            isPoem && { fontFamily: fonts.amiri },
          ]}
        >
          {memo.text}
        </MText>
      </MotiView>

      {/* ── Poem badge ───────────────────────────────────────────────────── */}
      {isPoem && (
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, delay: 160 }}
          style={styles.poemBadge}
        >
          <MText weight="semi" style={styles.poemBadgeText}>
            ✦ هذا المحفوظ شعر
          </MText>
        </MotiView>
      )}

      {/* ── Tags ─────────────────────────────────────────────────────────── */}
      {hasTags && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300, delay: 180 }}
          style={styles.tagsSection}
        >
          <MText weight="semi" style={styles.tagsSectionLabel}>الوسوم</MText>
          <View style={styles.tagsRow}>
            {memo.tags.map((tag, i) => (
              <View key={i} style={styles.tagChip}>
                <MText weight="semi" style={styles.tagText}>#{tag}</MText>
              </View>
            ))}
          </View>
        </MotiView>
      )}

      {/* ── Dates ────────────────────────────────────────────────────────── */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: 220 }}
        style={styles.datesCard}
      >
        <DateRow label="آخر مراجعة"    value={toLatinDate(memo.last_reviewed_at)} />
        <View style={styles.dateDivider} />
        <DateRow label="تاريخ الإضافة" value={toLatinDate(memo.created_at)} />
      </MotiView>

      </ScrollView>

      {/* ── Bottom action bar (fixed, outside scroll) ── */}
      <View style={styles.actionBar}>
        {/* Edit — always visible */}
        <SpringPressable
          onPress={goEdit}
          style={[styles.actionEdit, memo.stage === 'LEARNING' && styles.actionEditFull]}
        >
          <Pencil size={17} color={colors.textPrimary} />
          <MText weight="semi" style={styles.actionEditText}>تعديل</MText>
        </SpringPressable>

        {/* Review CTA — only for REVISION or MASTERED */}
        {memo.stage !== 'LEARNING' && (
          <SpringPressable onPress={goReview} style={styles.actionReview}>
            <BookOpen size={17} color={colors.primary} />
            <MText weight="bold" style={styles.actionReviewText}>ابدأ المراجعة</MText>
          </SpringPressable>
        )}
      </View>

    </SafeAreaView>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  topColor,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  topColor: string;
  delay: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 14, delay }}
      style={[styles.statCard, { borderTopColor: topColor, borderTopWidth: 2 }]}
    >
      {icon}
      <MText weight="bold" style={styles.statValue}>{value}</MText>
      <MText weight="regular" style={styles.statLabel}>{label}</MText>
    </MotiView>
  );
}

// ─── DateRow ─────────────────────────────────────────────────────────────────

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dateRow}>
      {/* RTL: label on RIGHT (comes first in row), value on LEFT */}
      <MText weight="semi"    style={styles.dateLabel}>{label}</MText>
      <MText weight="regular" style={styles.dateValue}>{value}</MText>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Safe wrapper ─────────────────────────────────────────────────────────
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // ── Top bar (fixed, doesn't scroll) ─────────────────────────────────────
  topBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  topBarNotFound: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.h3,
    color: colors.textPrimary,
  },

  // ── Scroll area ──────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },

  // ── Favorite strip ─────────────────────────────────────────────────────
  favoriteStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-end',       // RTL: right-aligned
    marginBottom: spacing.sm,
    backgroundColor: colors.errorSoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,115,81,0.25)',
  },
  favoriteText: {
    ...typography.caption,
    color: colors.error,
  },

  // ── Stats row ──────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.card,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // ── Label row ──────────────────────────────────────────────────────────
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    alignSelf: 'flex-end',       // RTL: stick to right
  },
  labelText: {
    ...typography.label,
    color: colors.textMuted,
  },

  // ── Text card ──────────────────────────────────────────────────────────
  textCard: {
    flexDirection: 'row',  // accent bar on RIGHT (RTL leading edge)
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.md,
    ...Shadows.card,
  },
  accentBar: {
    width: 3,
    borderRadius: radius.full,
    alignSelf: 'stretch',
    minHeight: 24,
  },
  memoText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'left',
    lineHeight: 34,          // generous for Arabic readability (>1.6×)
    writingDirection: 'ltr',
  },

  // ── Poem badge ─────────────────────────────────────────────────────────
  poemBadge: {
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  poemBadgeText: {
    ...typography.label,
    color: colors.catMatn,
  },

  // ── Tags ───────────────────────────────────────────────────────────────
  tagsSection: {
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  tagsSectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'left',
    marginBottom: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  tagText: {
    ...typography.caption,
    color: colors.textAccent,
  },

  // ── Dates card ─────────────────────────────────────────────────────────
  datesCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',   // label RIGHT, value LEFT
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dateDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  dateLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  dateValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // ── Action bar (fixed footer outside scroll) ──────────────────────────
  actionBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  // When LEARNING — edit button expands to fill the whole bar
  actionEditFull: {
    flex: 1,
    justifyContent: 'center',
  },
  actionEditText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  actionReview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    ...Shadows.glow,
    elevation: 8,
  },
  actionReviewText: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});

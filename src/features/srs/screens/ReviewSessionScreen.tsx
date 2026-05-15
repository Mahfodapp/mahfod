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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  Modal,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import { useMemoStore } from '../../memo/store/memo.store';
import { useSettingsStore } from '../../settings/store/settings.store';
import { applyRevision } from '../logic/revisionEngine';
import { Star, X, Eye, EyeOff, Info, ChevronDown, ZoomIn, ZoomOut, Pencil, Volume2, Maximize } from 'lucide-react-native';
import type { VanishMode } from '@/types';
import { VanishText } from '../components/VanishText';
import AudioWaveform from '@/shared/ui/AudioWaveform';
import ImageViewer from 'react-native-image-zoom-viewer';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

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

// ─── Font options ────────────────────────────────────────────────────────────

const FONTS = [
  { id: 'amiri',    name: 'أميري'   },
  { id: 'quran',    name: 'شهرزاد' },
  { id: 'reemKufi', name: 'كوفي'   },
  { id: 'lateef',   name: 'مغاربي' },
  { id: 'tajawal',  name: 'رقعة'   },
] as const;
type FontId = typeof FONTS[number]['id'];

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

  const [fontSize,         setFontSize]         = useState(Number(memo?.font_size) || 18);
  const [fontFamily,       setFontFamily]       = useState<FontId>((memo?.font_family as FontId) ?? 'amiri');
  const [isFontMenuOpen,   setIsFontMenuOpen]   = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [isAudioPlaying,   setIsAudioPlaying]   = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isBusy   = useRef(false);
  const mounted  = useRef(true);

  useEffect(() => {
    if (memo) {
      setFontSize(Number(memo.font_size) || 18);
      setFontFamily((memo.font_family as FontId) ?? 'amiri');
    }
  }, [currentId]);

  const handleZoomOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontSize(f => {
      const newSize = Math.max(12, f - 2);
      if (memo && newSize !== f) updateMemo(memo.id, { font_size: newSize }).catch(console.error);
      return newSize;
    });
  }, [memo, updateMemo]);

  const handleZoomIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontSize(f => {
      const newSize = Math.min(32, f + 2);
      if (memo && newSize !== f) updateMemo(memo.id, { font_size: newSize }).catch(console.error);
      return newSize;
    });
  }, [memo, updateMemo]);

  const handleFontFamilyChange = useCallback((newFont: FontId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontFamily(newFont);
    setIsFontMenuOpen(false);
    if (memo) updateMemo(memo.id, { font_family: newFont }).catch(console.error);
  }, [memo, updateMemo]);

  // ── Audio ────────────────────────────────────────────────────────────────────
  const attachFinishListener = useCallback((sound: Audio.Sound) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setIsAudioPlaying(false);
    });
  }, []);

  const unloadSound = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;
    soundRef.current = null;
    setIsAudioPlaying(false);
    try { await s.stopAsync(); } catch (_) {}
    try { await s.unloadAsync(); } catch (_) {}
  }, []);

  const loadAndPlaySound = useCallback(async (uri: string) => {
    await unloadSound();
    setIsAudioPlaying(true);
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      attachFinishListener(sound);
    } catch (err) {
      console.error('[ReviewSession] loadAndPlaySound failed', err);
      setIsAudioPlaying(false);
    }
  }, [unloadSound, attachFinishListener]);

  const replaySound = useCallback(async (uri: string) => {
    const s = soundRef.current;
    if (!s) return await loadAndPlaySound(uri);
    setIsAudioPlaying(true);
    try {
      await s.setPositionAsync(0);
      await s.playAsync();
    } catch (err) {
      console.error('[ReviewSession] replaySound failed', err);
      await loadAndPlaySound(uri);
    }
  }, [loadAndPlaySound]);

  useEffect(() => {
    if (memo?.audio_url) loadAndPlaySound(memo.audio_url);
    else setIsAudioPlaying(false);
    return () => { unloadSound(); };
  }, [currentId]);

  useEffect(() => () => { unloadSound(); }, [unloadSound]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!done && queueIds.length > 0) {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake();
    }
    return () => { deactivateKeepAwake(); };
  }, [done, queueIds.length]);

  // ── Vanish mode ─────────────────────────────────────────────────────────────
  const vanishMode = (settings.vanish_mode ?? 'none') as VanishMode;
  const vanishReps = settings.vanish_reps ?? 3;
  const [isVanishRevealed, setIsVanishRevealed] = useState(false);
  // Reset manual reveal when the displayed memo changes
  useEffect(() => { setIsVanishRevealed(false); }, [currentId]);

  // Use lifetime review_count as the vanish comparator — same pattern as
  // LearningSessionScreen which uses memo.repetition_count.
  // This is stable across memo advances and correctly reflects how many times
  // the user has reviewed this specific memo throughout all sessions.
  // The old approach used `reps` (in-session counter) which resets to 0 on
  // every advance, so the threshold was never met in fixed mode, and in SM-2
  // mode `revealed ? vanishReps : 0` always hit the threshold the instant the
  // user pressed "قرأت", regardless of actual repetition history.
  const lifetimeReviews     = memo?.review_count ?? 0;
  const vanishThresholdMet  = vanishMode !== 'none' && lifetimeReviews >= vanishReps;
  const isVanishActive      = vanishThresholdMet && !isVanishRevealed;
  const textImgOpacity      = isVanishActive && vanishMode === 'opacity' ? 0.07 : 1;
  const textImgHidden       = isVanishActive && vanishMode === 'sudden';
  const isWordsMode         = isVanishActive && vanishMode === 'words';

  // ── Animated progress bar ──────────────────────────────────────────────────

  const progressAnim = useSharedValue(0);
  useEffect(() => {
    const pct = queueIds.length > 0 ? (index + 1) / queueIds.length : 0;
    progressAnim.value = withTiming(pct, { duration: 450 });
  }, [index, queueIds.length]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
    backgroundColor: progressAnim.value >= 1 ? colors.success : colors.accent,
  }));

  const favScale    = useSharedValue(1);
  const favRotation = useSharedValue(0);
  const favStyle    = useAnimatedStyle(() => ({
    transform: [{ scale: favScale.value }, { rotate: `${favRotation.value}deg` }],
  }));
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

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

  const handleFavorite = useCallback(async () => {
    if (!memo) return;
    const isNowFav = !memo.is_favorite;
    if (isNowFav) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      favScale.value    = withSequence(withTiming(1.4, { duration: 150 }), withSpring(1, { damping: 12, stiffness: 200 }));
      favRotation.value = withSequence(withTiming(72, { duration: 150 }), withTiming(0, { duration: 0 }));
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      favScale.value = withSequence(withTiming(0.8, { duration: 100 }), withSpring(1, { damping: 12, stiffness: 200 }));
    }
    try { await updateMemo(memo.id, { is_favorite: isNowFav }); } catch (e) { console.error('fav toggle', e); }
  }, [memo, updateMemo, favScale, favRotation]);

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
  
  if (!memo) {
    return (
      <SafeAreaView style={styles.safe} edges={['top','left','right']}>
        <MahfodPatternBackground />
        <View style={styles.centerState}>
          <MText weight="regular" style={styles.doneSub}>جاري التحميل...</MText>
        </View>
      </SafeAreaView>
    );
  }

  const isFav     = memo.is_favorite;
  const reviewDay = (memo.review_count ?? 0) + 1;

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
          <Animated.View style={favStyle}>
            <Star
              size={20}
              color={isFav ? colors.accent : colors.textMuted}
              fill={isFav ? colors.accent : 'transparent'}
              strokeWidth={1.8}
            />
          </Animated.View>
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

        {/* ── Toolbar: edit · zoom · font · image · vanish ── */}
        <View style={styles.fontControlsWrap}>
          <View style={styles.fontControls}>
            <TouchableOpacity
              style={styles.fontBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('AddMemoScreen', { memoId: memo.id }); }}
            >
              <Pencil size={15} color={colors.accent} />
            </TouchableOpacity>

            <View style={styles.fontDivider} />

            <TouchableOpacity style={styles.fontBtn} onPress={handleZoomOut}>
              <ZoomOut size={16} color={colors.accent} />
            </TouchableOpacity>
            <View style={styles.fontSizeDisplay}>
              <MText weight="semi" style={styles.fontSizeText}>{fontSize}</MText>
            </View>
            <TouchableOpacity style={styles.fontBtn} onPress={handleZoomIn}>
              <ZoomIn size={16} color={colors.accent} />
            </TouchableOpacity>

            <View style={styles.fontDivider} />

            <TouchableOpacity
              style={styles.fontFamilyBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsFontMenuOpen(v => !v);
              }}
            >
              <MText weight="semi" style={styles.fontFamilyBtnText}>
                {FONTS.find(f => f.id === fontFamily)?.name}
              </MText>
              <MotiView animate={{ rotate: isFontMenuOpen ? '180deg' : '0deg' }} transition={{ type: 'spring' }}>
                <ChevronDown size={14} color={colors.accent} />
              </MotiView>
            </TouchableOpacity>

            {memo.image_url && (
              <TouchableOpacity style={styles.fullscreenToolBtn} onPress={() => setIsImageFullscreen(true)}>
                <Maximize size={15} color={colors.primary} />
              </TouchableOpacity>
            )}

            {/* Vanish toggle — shown whenever the vanish threshold is met;
                Eye    = text is hidden  → press to reveal
                EyeOff = text is visible → press to re-hide */}
            {vanishThresholdMet && (
              <>
                <View style={styles.fontDivider} />
                <TouchableOpacity
                  style={[styles.fontBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsVanishRevealed(v => !v); }}
                  hitSlop={8}
                >
                  {isVanishRevealed
                    ? <EyeOff size={16} color={colors.accent} />
                    : <Eye    size={16} color={colors.accent} />}
                </TouchableOpacity>
              </>
            )}
          </View>

          <MotiView
            animate={{ height: isFontMenuOpen ? 48 : 0, opacity: isFontMenuOpen ? 1 : 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={styles.fontPillsContainer}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontPillScroll}>
              {FONTS.map(f => {
                const isActive = fontFamily === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.fontPill, isActive && styles.fontPillActive]}
                    onPress={() => handleFontFamilyChange(f.id)}
                  >
                    <MText weight="semi" style={isActive ? styles.fontPillActiveText : styles.fontPillText}>
                      {f.name}
                    </MText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </MotiView>
        </View>

        {/* ── Image (if attached) ── */}
        {memo.image_url && !textImgHidden && (
          <View style={{ opacity: textImgOpacity }}>
            <Image source={{ uri: memo.image_url }} style={styles.memoImage} resizeMode="contain" />
          </View>
        )}

        {/* ── Memo text (no card frame) ── */}
        {textImgHidden ? null : (
          <Animated.View style={[{ opacity: textImgOpacity }, cardStyle]}>
            {memo.is_poem ? (
              <View style={styles.poemWrap}>
                {isWordsMode ? (
                  <VanishText
                    text={memo.text.split('***')[0]?.trim() ?? ''}
                    memoId={memo.id}
                    style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}
                  />
                ) : (
                  <MText weight="bold" style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}>
                    {memo.text.split('***')[0]?.trim()}
                  </MText>
                )}
                <View style={styles.poemDivider} />
                {isWordsMode ? (
                  <VanishText
                    text={memo.text.split('***')[1]?.trim() ?? ''}
                    memoId={memo.id + '-2'}
                    style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}
                  />
                ) : (
                  <MText weight="bold" style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}>
                    {memo.text.split('***')[1]?.trim()}
                  </MText>
                )}
              </View>
            ) : (
              isWordsMode ? (
                <VanishText
                  text={memo.text}
                  memoId={memo.id}
                  style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}
                />
              ) : (
                <MText weight="bold" style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}>
                  {memo.text}
                </MText>
              )
            )}
          </Animated.View>
        )}

        {/* ── Audio indicator ── */}
        {memo.audio_url ? (
          <View style={styles.audioIndicator}>
            {isAudioPlaying ? (
              <><AudioWaveform isActive /><MText weight="semi" style={styles.audioLabel}>جاري التشغيل...</MText></>
            ) : (
              <TouchableOpacity style={styles.audioReplayBtn} onPress={() => replaySound(memo.audio_url!)}>
                <Volume2 size={16} color={colors.accent} />
                <MText weight="semi" style={[styles.audioLabel, { color: colors.accent }]}>إعادة التشغيل</MText>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

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
          {isAudioPlaying && (
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 180 }} style={styles.audioGateNotice}>
              <Volume2 size={13} color={colors.textMuted} />
              <MText weight="semi" style={styles.audioGateText}>انتظر انتهاء التشغيل</MText>
            </MotiView>
          )}
          <Animated.View style={btnStyle}>
            <Pressable
              style={[styles.ctaBtn, isAudioPlaying && styles.ctaBtnBusy]}
              onPressIn={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); btnScale.value = withSpring(0.94, { damping: 16, stiffness: 400 }); }}
              onPressOut={() => { btnScale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
              onPress={handleRepeat}
              disabled={isAudioPlaying}
            >
              <MText weight="extra" style={[styles.ctaBtnText, isAudioPlaying && { opacity: 0.45 }]}>
                كررت ({reps}/{sessionReps})
              </MText>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SM-2 MODE FOOTER
          ══════════════════════════════════════════════════════════════════ */}
      {mode === 'sm2' && (
        <View style={styles.footer}>
          {isAudioPlaying && (
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 180 }} style={styles.audioGateNotice}>
              <Volume2 size={13} color={colors.textMuted} />
              <MText weight="semi" style={styles.audioGateText}>انتظر انتهاء التشغيل</MText>
            </MotiView>
          )}
          {!revealed ? (
            <Animated.View style={btnStyle}>
              <Pressable
                style={styles.ctaBtn}
                onPressIn={() => { btnScale.value = withSpring(0.94, { damping: 16, stiffness: 400 }); }}
                onPressOut={() => { btnScale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
                onPress={handleRevealed}
              >
                <Eye size={20} color={colors.primary} />
                <MText weight="extra" style={styles.ctaBtnText}> قرأت</MText>
              </Pressable>
            </Animated.View>
          ) : (
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

      {/* ── Fullscreen image modal ── */}
      <Modal visible={isImageFullscreen} transparent animationType="fade" onRequestClose={() => setIsImageFullscreen(false)}>
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity style={styles.fullscreenCloseBtn} onPress={() => setIsImageFullscreen(false)}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          {memo.image_url && (
            <View style={{ flex: 1 }}>
              <ImageViewer
                imageUrls={[{ url: memo.image_url }]}
                backgroundColor={colors.primary}
                renderIndicator={() => <View />}
              />
            </View>
          )}
        </View>
      </Modal>
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
    height: 2,
    backgroundColor: colors.surfaceHigh,
  },
  progressFill: {
    height: 2,
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
  fontControlsWrap: {
    gap: spacing.xs,
  },
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
  fontDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  fontFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontFamilyBtnText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  fontPillsContainer: {
    overflow: 'hidden',
  },
  fontPillScroll: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center' as const,
  },
  fontPill: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fontPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  fontPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fontPillActiveText: {
    ...typography.caption,
    color: colors.primary,
  },

  memoText: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'left',
    lineHeight: 44,
    writingDirection: 'ltr',
  },
  poemWrap: {
    gap: spacing.md,
    width: '100%',
  },
  poemDivider: {
    height: 1,
    width: '35%',
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginVertical: spacing.md,
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

  // ── Audio ──────────────────────────────────────────────────────────────────
  audioIndicator: { marginTop: spacing.sm, alignItems: 'center', gap: spacing.xs },
  audioLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  audioReplayBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.full, borderWidth: 1, borderColor: colors.accentBorder },
  audioGateNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingBottom: spacing.xs },
  audioGateText: { ...typography.caption, color: colors.textMuted },
  ctaBtnBusy: { opacity: 0.6 },

  // ── Image + fullscreen ─────────────────────────────────────────────────────
  memoImage: { width: '100%', height: 280, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.surfaceHigh },
  fullscreenToolBtn: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  fullscreenContainer: { flex: 1, backgroundColor: colors.primary, paddingTop: 60 },
  fullscreenCloseBtn: { position: 'absolute', top: 50, right: spacing.lg, width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 1, borderColor: colors.border },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Pressable, Image, Dimensions, Modal, AppState, AppStateStatus, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence } from 'react-native-reanimated';
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
import { Star, X, BookOpen, Volume2, Pencil, ZoomIn, ZoomOut, ChevronDown, Maximize, Eye, EyeOff } from 'lucide-react-native';
import type { VanishMode } from '@/types';
import { VanishText } from '../components/VanishText';
import AudioWaveform from '@/shared/ui/AudioWaveform';
import ImageViewer from 'react-native-image-zoom-viewer';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import FloatingBubbleService from '../services/FloatingBubbleService';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'LearningSessionScreen'>;

export function LearningSessionScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const paramMemoId = route.params?.memoId;

  const memos = useMemoStore(s => s.memos);
  const fetchMemos = useMemoStore(s => s.fetchMemos);
  const recordRepetition = useMemoStore(s => s.recordRepetition);
  const updateMemo = useMemoStore(s => s.updateMemo);
  const { settings } = useSettingsStore();

  const initialReps = settings.initial_reps ?? 33;

  const [queueIds, setQueueIds] = useState<string[]>(() => {
    if (paramMemoId) {
      const m = memos.find(m => m.id === paramMemoId && m.stage === 'LEARNING');
      return m ? [m.id] : [];
    }
    return memos.filter(m => m.stage === 'LEARNING').map(m => m.id);
  });

  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [promoted, setPromoted] = useState<string[]>([]);
  const isBusy = useRef(false);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  const FONTS = [
    { id: 'amiri', name: 'أميري' },
    { id: 'quran', name: 'شهرزاد' },
    { id: 'reemKufi', name: 'كوفي' },
    { id: 'lateef', name: 'مغاربي' },
    { id: 'tajawal', name: 'رقعة' },
  ] as const;

  const currentId = queueIds[index];
  const memo = memos.find(m => m.id === currentId);
  const currentReps = memo?.repetition_count ?? 0;
  const repPct = Math.min(currentReps / initialReps, 1);

  const [fontSize, setFontSize] = useState(Number(memo?.font_size) || 20);
  const [fontFamily, setFontFamily] = useState<'amiri' | 'quran' | 'reemKufi' | 'lateef' | 'tajawal'>((memo?.font_family as any) ?? 'amiri');

  useEffect(() => {
    if (memo) {
      setFontSize(Number(memo.font_size) || 20);
      setFontFamily((memo.font_family as any) ?? 'amiri');
    }
  }, [currentId]);

  // ── Vanish mode ─────────────────────────────────────────────────────────────
  const vanishMode   = (settings.vanish_mode ?? 'none') as VanishMode;
  const vanishReps   = settings.vanish_reps   ?? 3;
  // currentReps = total repetitions this memo has accumulated across all sessions
  const [isVanishRevealed, setIsVanishRevealed] = useState(false);
  // Reset manual reveal when the displayed memo changes
  useEffect(() => { setIsVanishRevealed(false); }, [currentId]);

  const vanishThresholdMet = vanishMode !== 'none' && currentReps >= vanishReps;
  const isVanishActive     = vanishThresholdMet && !isVanishRevealed;
  // For 'opacity' mode: reduce to near-invisible; for 'sudden': fully hide
  const textImgOpacity = isVanishActive && vanishMode === 'opacity' ? 0.07 : 1;
  const textImgHidden  = isVanishActive && vanishMode === 'sudden';
  const isWordsMode    = isVanishActive && vanishMode === 'words';

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
      const newSize = Math.min(40, f + 2);
      if (memo && newSize !== f) updateMemo(memo.id, { font_size: newSize }).catch(console.error);
      return newSize;
    });
  }, [memo, updateMemo]);

  const handleFontFamilyChange = useCallback((newFont: 'amiri' | 'quran' | 'reemKufi' | 'lateef' | 'tajawal') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontFamily(newFont);
    setIsFontMenuOpen(false);
    if (memo) updateMemo(memo.id, { font_family: newFont }).catch(console.error);
  }, [memo, updateMemo]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

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
      console.error('[LearningSession] loadAndPlaySound failed', err);
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
      console.error('[LearningSession] replaySound failed', err);
      await loadAndPlaySound(uri);
    }
  }, [loadAndPlaySound]);

  useEffect(() => {
    if (memo?.audio_url) loadAndPlaySound(memo.audio_url);
    else setIsAudioPlaying(false);
    return () => { unloadSound(); };
  }, [currentId]);

  useEffect(() => () => { unloadSound(); }, [unloadSound]);

  const isRepeatLocked = isAudioPlaying;

  useEffect(() => { if (memos.length === 0) fetchMemos(); }, [fetchMemos]);
  useEffect(() => {
    if (!paramMemoId && memos.length > 0 && queueIds.length === 0) {
      setQueueIds(memos.filter(m => m.stage === 'LEARNING').map(m => m.id));
    }
  }, [memos]);

  useEffect(() => {
    if (!done && queueIds.length > 0) {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake();
    }
    return () => {
      deactivateKeepAwake();
    };
  }, [done, queueIds.length]);

  useEffect(() => {
    FloatingBubbleService.requestBubblePermission().catch(() => {});

    FloatingBubbleService.setupListeners(
      async () => {
        // On bubble press
        Vibration.vibrate(40);
        await handleRepeat();
      },
      () => {
        // On bubble removed
        FloatingBubbleService.hideBubble();
      }
    );

    return () => {
      FloatingBubbleService.clearListeners();
      FloatingBubbleService.hideBubble();
    };
  }, [handleRepeat]);

  useEffect(() => {
    FloatingBubbleService.updateText(`${currentReps}/${initialReps}`);
  }, [currentReps, initialReps]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (!done && queueIds.length > 0) {
          FloatingBubbleService.showBubble(100, 200, `${currentReps}/${initialReps}`);
        }
      } else if (nextAppState === 'active') {
        FloatingBubbleService.hideBubble();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [done, queueIds.length, currentReps, initialReps]);

  const queueProgressAnim = useSharedValue(0);
  useEffect(() => {
    const pct = queueIds.length > 0 ? (index + 1) / queueIds.length : 0;
    queueProgressAnim.value = withTiming(pct, { duration: 400 });
  }, [index, queueIds.length]);
  const queueProgressStyle = useAnimatedStyle(() => ({
    width: `${queueProgressAnim.value * 100}%`,
  }));

  const repBarAnim = useSharedValue(repPct);
  useEffect(() => {
    repBarAnim.value = withTiming(Math.min(currentReps / initialReps, 1), { duration: 450 });
  }, [currentReps, initialReps]);
  const repBarStyle = useAnimatedStyle(() => ({
    width: `${repBarAnim.value * 100}%`,
    backgroundColor: repBarAnim.value >= 1 ? colors.success : colors.accent,
  }));

  const cardSlide = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardSlide.value }],
    opacity: cardOpacity.value,
  }));
  const animateCardIn = useCallback(() => {
    cardSlide.value = 50;
    cardOpacity.value = 0;
    cardSlide.value = withSpring(0, { damping: 16, stiffness: 200 });
    cardOpacity.value = withTiming(1, { duration: 280 });
  }, []);
  useEffect(() => { animateCardIn(); }, [index]);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }]
  }));

  const favScale = useSharedValue(1);
  const favRotation = useSharedValue(0);
  const favStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: favScale.value },
      { rotate: `${favRotation.value}deg` }
    ]
  }));

  const advance = useCallback(() => {
    if (index + 1 >= queueIds.length) setDone(true);
    else setIndex(i => i + 1);
  }, [index, queueIds.length]);

  const handlePressIn = useCallback(() => {
    if (isRepeatLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSpring(0.94, { damping: 16, stiffness: 400 });
  }, [isRepeatLocked, btnScale]);

  const handlePressOut = useCallback(() => {
    btnScale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, [btnScale]);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const handleRepeat = useCallback(async () => {
    if (isBusy.current || !memo || isRepeatLocked) return;
    isBusy.current = true;
    
    // Only wait visually if app is active. Background Android throttles setTimeout indefinitely.
    if (AppState.currentState === 'active') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(r => setTimeout(r, 150));
      if (!mounted.current) {
        isBusy.current = false;
        return;
      }
    }

    try {
      const updated = await recordRepetition(memo.id);
      if (!mounted.current) return;

      if (updated && updated.stage === 'REVISION') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPromoted(p => [...p, memo.id]);
        advance();
      } else if (memo.audio_url) {
        replaySound(memo.audio_url);
      }
    } catch (e) {
      console.error('[LearningSession] handleRepeat failed', e);
    } finally {
      if (mounted.current) {
        isBusy.current = false;
      }
    }
  }, [memo, isRepeatLocked, recordRepetition, advance, replaySound]);

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const handleToggleFavorite = useCallback(async () => {
    if (!memo) return;
    
    const isNowFav = !memo.is_favorite;
    
    if (isNowFav) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      favScale.value = withSequence(
        withTiming(1.4, { duration: 150 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      favRotation.value = withSequence(
        withTiming(72, { duration: 150 }),
        withTiming(0, { duration: 0 })
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      favScale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }

    try {
      await updateMemo(memo.id, { is_favorite: isNowFav });
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  }, [memo, updateMemo, favScale, favRotation]);

  if (queueIds.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top','left','right']}>
        <MahfodPatternBackground />
        <View style={styles.centerState}>
          <MotiView from={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12 }}>
            <BookOpen size={60} color={colors.accent} strokeWidth={1.4} />
          </MotiView>
          <MText weight="bold" style={styles.doneTitle}>لا توجد محفوظات في طور الحفظ</MText>
          <MText weight="regular" style={styles.doneSub}>أضف محفوظات جديدة للبدء</MText>
          <TouchableOpacity onPress={handleCancel} style={styles.doneBtn}>
            <MText weight="bold" style={styles.doneBtnText}>العودة</MText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={['top','left','right']}>
        <MahfodPatternBackground />
        <View style={styles.centerState}>
          <MotiView from={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 10 }}>
            <Star size={80} color={colors.accent} fill={colors.accent} strokeWidth={1.2} />
          </MotiView>
          <MText weight="extra" style={styles.doneTitle}>أحسنت! 🎉</MText>
          <MText weight="regular" style={styles.doneSub}>انتهت جلسة الحفظ — {queueIds.length} محفوظ</MText>
          {promoted.length > 0 && (
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 14, delay: 250 }} style={styles.promotedBadge}>
              <MText weight="bold" style={styles.promotedText}>✦ {promoted.length} محفوظ انتقل إلى مرحلة المراجعة</MText>
            </MotiView>
          )}
          <TouchableOpacity onPress={handleCancel} style={styles.doneBtn}>
            <MText weight="bold" style={styles.doneBtnText}>العودة للرئيسية</MText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MahfodPatternBackground />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.starBtn} hitSlop={10} onPress={handleToggleFavorite} activeOpacity={0.8}>
            <Animated.View style={favStyle}>
              <Star size={18} color={memo.is_favorite ? colors.accent : colors.textMuted} fill={memo.is_favorite ? colors.accent : 'none'} />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.repPill}>
            <MText weight="bold" style={styles.repPillText}>{currentReps}</MText>
          </View>
        </View>
        <View style={styles.headerCenter}>
          <MText weight="bold" style={styles.headerTitle} numberOfLines={1}>{memo.title}</MText>
          <MText weight="regular" style={styles.headerSub}>التكرار {currentReps} / {initialReps}</MText>
        </View>
        <TouchableOpacity onPress={handleCancel} style={styles.closeBtn} hitSlop={10}>
          <X size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.queueTrack}>
        <Animated.View style={[styles.queueFill, repBarStyle]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} overScrollMode="never">
        <Animated.View style={cardStyle}>
          {/* Image — words mode leaves images untouched; opacity dims; sudden hides */}
          {memo.image_url && !textImgHidden ? (
            <View style={{ opacity: textImgOpacity }}>
              <Image
                source={{ uri: memo.image_url }}
                style={styles.memoImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          <View style={[styles.toolbar, { borderBottomWidth: 0, paddingHorizontal: 0, paddingVertical: 0, marginBottom: spacing.md }]}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('AddMemoScreen', { memoId: memo.id }); }}>
              <Pencil size={15} color={colors.accent} />
            </TouchableOpacity>
            
            <View style={styles.toolDivider} />
            
            <TouchableOpacity style={styles.toolBtn} onPress={handleZoomOut}>
              <ZoomOut size={16} color={colors.accent} />
            </TouchableOpacity>
            <MText weight="semi" style={styles.toolSizeText}>{fontSize}%</MText>
            <TouchableOpacity style={styles.toolBtn} onPress={handleZoomIn}>
              <ZoomIn size={16} color={colors.accent} />
            </TouchableOpacity>

            {/* Vanish toggle — shown whenever the vanish threshold is met;
                Eye   = text is hidden  → press to reveal
                EyeOff = text is visible → press to re-hide */}
            {vanishThresholdMet && (
              <>
                <View style={styles.toolDivider} />
                <TouchableOpacity
                  style={[styles.toolBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsVanishRevealed(v => !v); }}
                  hitSlop={8}
                >
                  {isVanishRevealed
                    ? <EyeOff size={16} color={colors.accent} />
                    : <Eye    size={16} color={colors.accent} />}
                </TouchableOpacity>
              </>
            )}

            <View style={{ flex: 1 }} />

            {memo.image_url && (
              <TouchableOpacity style={styles.fullscreenToolBtn} onPress={() => setIsImageFullscreen(true)}>
                <Maximize size={15} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.fontSelectorBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsFontMenuOpen(v => !v);
              }}
            >
              <MText weight="semi" style={styles.fontSelectorText}>
                {FONTS.find(f => f.id === fontFamily)?.name}
              </MText>
              <MotiView animate={{ rotate: isFontMenuOpen ? '180deg' : '0deg' }} transition={{ type: 'spring' }}>
                <ChevronDown size={14} color={colors.accent} />
              </MotiView>
            </TouchableOpacity>
          </View>

          <MotiView
            animate={{ 
              height: isFontMenuOpen ? 50 : 0, 
              opacity: isFontMenuOpen ? 1 : 0,
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={[styles.fontDropdownContainer, { borderBottomWidth: 0, marginBottom: isFontMenuOpen ? spacing.md : 0 }]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.fontPillScroll, { paddingHorizontal: 0 }]}>
              {FONTS.map(f => {
                const isActive = fontFamily === f.id;
                return (
                  <TouchableOpacity key={f.id} style={[styles.toolPill, isActive && styles.toolPillActive]} onPress={() => handleFontFamilyChange(f.id)}>
                    <MText weight="semi" style={isActive ? styles.toolPillActiveText : styles.toolPillText}>{f.name}</MText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </MotiView>
          {/* ── Memo text — vanish mode applied (audio never affected) ── */}
          {textImgHidden ? null : (
            <View style={{ opacity: textImgOpacity }}>
              {memo.is_poem ? (
                <View>
                  {isWordsMode ? (
                    <VanishText
                      text={memo.text.split('***')[0]?.trim() ?? ''}
                      memoId={memo.id}
                      style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}
                    />
                  ) : (
                    <MText style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}>
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
                    <MText style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}>
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
                  <MText style={[styles.memoText, { fontSize, fontFamily: fonts[fontFamily] }]}>
                    {memo.text}
                  </MText>
                )
              )}
            </View>
          )}
        </Animated.View>

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
      </ScrollView>

      <View style={styles.footer}>
        {isRepeatLocked && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 180 }} style={styles.audioGateNotice}>
            <Volume2 size={13} color={colors.textMuted} />
            <MText weight="semi" style={styles.audioGateText}>انتظر انتهاء التشغيل</MText>
          </MotiView>
        )}
        <Animated.View style={btnStyle}>
          <Pressable
            style={[styles.ctaBtn, isRepeatLocked && styles.ctaBtnBusy]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleRepeat}
            disabled={isRepeatLocked}
          >
            <MText weight="extra" style={[styles.ctaBtnText, isRepeatLocked && { opacity: 0.45 }]}>
              سجل تكرار ({currentReps}/{initialReps})
            </MText>
          </Pressable>
        </Animated.View>
      </View>

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
          <View style={styles.footer}>
            {isRepeatLocked && (
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 180 }} style={styles.audioGateNotice}>
                <Volume2 size={13} color={colors.textMuted} />
                <MText weight="semi" style={styles.audioGateText}>انتظر انتهاء التشغيل</MText>
              </MotiView>
            )}
            <Animated.View style={btnStyle}>
              <Pressable
                style={[styles.ctaBtn, isRepeatLocked && styles.ctaBtnBusy]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={async () => {
                  await handleRepeat();
                  if (!isRepeatLocked) setIsImageFullscreen(false);
                }}
                disabled={isRepeatLocked}
              >
                <MText weight="extra" style={[styles.ctaBtnText, isRepeatLocked && { opacity: 0.45 }]}>
                  سجل تكرار ({currentReps}/{initialReps})
                </MText>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  headerSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  starBtn: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  repPill: { width: 34, height: 34, backgroundColor: colors.accent, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  repPillText: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary, textAlign: 'center', includeFontPadding: false, transform: [{ translateY: -1 }] },
  closeBtn: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  queueTrack: { height: 2, backgroundColor: colors.surfaceHigh },
  queueFill: { height: 2, backgroundColor: colors.accent, borderRadius: 99 },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  toolBtn: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  fontPillScroll: { gap: spacing.xs, paddingHorizontal: spacing.md, alignItems: 'center' },
  toolPill: { paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  toolPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  toolPillText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  toolPillActiveText: { ...typography.caption, color: colors.primary, textAlign: 'center' },
  toolDivider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  toolSizeText: { ...typography.caption, color: colors.textSecondary, minWidth: 32, textAlign: 'center' },
  fontSelectorBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm + 4, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  fontSelectorText: { ...typography.caption, color: colors.textPrimary },
  fontDropdownContainer: { overflow: 'hidden', backgroundColor: colors.primary, borderBottomWidth: 1, borderBottomColor: colors.border },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: 140 },
  memoImage: { width: '100%', height: SCREEN_HEIGHT * 0.5, borderRadius: radius.md, marginBottom: spacing.md, backgroundColor: colors.surfaceHigh },
  memoText: { fontFamily: fonts.bold, color: colors.textPrimary, textAlign: 'left', lineHeight: 44, writingDirection: 'ltr' },
  poemDivider: { height: 1, width: '35%', backgroundColor: colors.border, alignSelf: 'center', marginVertical: spacing.md },
  audioIndicator: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.xs },
  audioLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  audioReplayBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.full, borderWidth: 1, borderColor: colors.accentBorder },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.lg, backgroundColor: colors.primary, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  audioGateNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingBottom: spacing.xs },
  audioGateText: { ...typography.caption, color: colors.textMuted },
  ctaBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', ...Shadows.glow, elevation: 10 },
  ctaBtnBusy: { opacity: 0.6 },
  ctaBtnText: { fontFamily: fonts.extra, fontSize: 18, color: colors.primary },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  doneTitle: { ...typography.h1, color: colors.accent, textAlign: 'center' },
  doneSub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  promotedBadge: { backgroundColor: colors.accentSoft, borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.accentBorder },
  promotedText: { ...typography.bodySmall, color: colors.accent, textAlign: 'center' },
  doneBtn: { marginTop: spacing.sm, backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: spacing.xl, borderRadius: radius.full, ...Shadows.glow, elevation: 8 },
  doneBtnText: { ...typography.h3, color: colors.primary },
  fullscreenToolBtn: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  fullscreenContainer: { flex: 1, backgroundColor: colors.primary, paddingTop: 60 },
  fullscreenCloseBtn: { position: 'absolute', top: 50, right: spacing.lg, width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 1, borderColor: colors.border },
  fullscreenImage: { flex: 1, width: '100%', marginVertical: spacing.xl },
});

export default LearningSessionScreen;

import sys
with open("c:\\Users\\dell\\Desktop\\mahfodap\\src\\screens\\LearnScreen.tsx", "w", encoding="utf-8") as file:
    file.write("""import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image,
    Modal, PanResponder, Animated, Dimensions, I18nManager
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../App';
import { useMemoStore, VanishMode } from '../store/useMemoStore';
import { colors, typography, shadows, anim } from '../theme/colors';
import { CheckCircle, Eye, EyeOff, Play, Pause, X, Award, RotateCcw, LogOut, Mic, MicOff, Sparkles, Loader, ZoomIn, ZoomOut, Pencil, Star } from 'lucide-react-native';
import { LabelBadge } from '../components/LabelBadge';
import { showAlert } from '../components/CustomAlert';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import ImageViewer from 'react-native-image-zoom-viewer';
import * as FileSystem from 'expo-file-system';
import { checkSpeechAgainstText, addTashkeelToText } from '../services/aiService';
import { useTranslation } from 'react-i18next';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

type Props = NativeStackScreenProps<RootStackParamList, 'Learn'>;
const { width: SW, height: SH } = Dimensions.get('window');
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function LearnScreen({ route, navigation }: Props) {
    const { memoId } = route.params;
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const memo = useMemoStore(s => s.memos.find(m => m.id === memoId));
    const settings = useMemoStore(s => s.settings);
    const memoPrefs = useMemoStore(s => s.memoPrefs[memoId] || {});
    const updateMemoPrefs = useMemoStore(s => s.updateMemoPrefs);
    const fontSizeScale = memoPrefs.fontSizeScale ?? settings.fontSizeScale ?? 1;
    const updateSettings = useMemoStore(s => s.updateSettings);

    // ── Font family cycler — 3 distinct Arabic fonts ─────────────────────────
    const FONTS: Array<{ family: string; label: string; hint: string }> = [
        { family: 'Cairo_800ExtraBold',       label: 'ك', hint: 'كوفي'   }, // Modern geometric Cairo
        { family: 'Amiri_400Regular',          label: 'أ', hint: 'أميري'  }, // Classical Naskh (Amiri)
        { family: 'ScheherazadeNew_400Regular', label: 'ش', hint: 'شهرزاد' }, // Traditional calligraphic
    ];
    const [fontIdx, setFontIdx] = useState(memoPrefs.fontIdx ?? 0);
    const currentFontFamily = FONTS[fontIdx].family;
    const cycleFont = () => setFontIdx(i => {
        const next = (i + 1) % FONTS.length;
        updateMemoPrefs(memoId, { fontIdx: next });
        return next;
    });

    // ── AI Tashkeel state ─────────────────────────────────────────────────────
    const [tashkeeledText, setTashkeeledText] = useState<string | null>(null);
    const [isLoadingTashkeel, setIsLoadingTashkeel] = useState(false);

    // ── Pinch-to-zoom — live scale updated on every frame via onUpdate ─────────
    const pinchBaseScale = useRef(fontSizeScale);
    const lastApplied   = useRef(fontSizeScale);
    const pinchGesture = Gesture.Pinch()
        .onBegin(() => {
            pinchBaseScale.current = lastApplied.current;
        })
        .onUpdate((e) => {
            const ns = parseFloat(Math.min(2.0, Math.max(0.6, pinchBaseScale.current * e.scale)).toFixed(2));
            if (Math.abs(ns - lastApplied.current) >= 0.04) {
                lastApplied.current = ns;
                updateMemoPrefs(memoId, { fontSizeScale: ns });
            }
        })
        .onEnd((e) => {
            const ns = parseFloat(Math.min(2.0, Math.max(0.6, pinchBaseScale.current * e.scale)).toFixed(2));
            lastApplied.current = ns;
            updateMemoPrefs(memoId, { fontSizeScale: ns });
        })
        .runOnJS(true);
    const saveLearningProgress = useMemoStore(s => s.saveLearningProgress);
    const completeLearning = useMemoStore(s => s.completeLearning);
    const completeReview = useMemoStore(s => s.completeReview);
    const incrementTotalReps = useMemoStore(s => s.incrementTotalReps);
    const toggleFavorite = useMemoStore(s => s.toggleFavorite);
    const incrementMemoReps = useMemoStore(s => s.incrementMemoReps);
    const totalReps = useMemoStore(s => s.totalRepetitions);
    const savedCount = useMemoStore(s => s.learningProgress[memoId] ?? 0);
    const getChain = useMemoStore(s => s.getChain);
    const allMemos = useMemoStore(s => s.memos);

    // ── Chain: find next portion if this memo is in a chain ──────────────────
    const nextChainMemo = (() => {
        if (!memo) return undefined;
        // Determine root id
        const rootId = memo.relatedMemoId ?? memo.id;
        // Only navigate if this is a chain memo (root with portions OR a portion)
        const chain = getChain(rootId);
        if (chain.length <= 1) return undefined;  // standalone, no chain
        const myIndex = chain.findIndex(m => m.id === memoId);
        if (myIndex === -1 || myIndex >= chain.length - 1) return undefined; // last in chain
        return chain[myIndex + 1];
    })();

    const isReviewMode = memo?.stage !== 'LEARNING';
    const maxCount = isReviewMode ? (settings.reinforceRepetitions ?? 5) : settings.initialRepetitions;
    const vanishMode: VanishMode = settings.vanishMode;
    const vanishAllAfter: number = settings.vanishAllAfter ?? 5;

    const [count, setCount] = useState<number>(isReviewMode ? 0 : savedCount);
    const [done, setDone] = useState(isReviewMode ? false : savedCount >= maxCount);
    const [revealed, setRevealed] = useState(isReviewMode ? false : savedCount > 0);

    // Audio
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioFinished, setAudioDone] = useState(true);
    const [playProg, setPlayProg] = useState(0);
    const [speed, setSpeed] = useState(1);
    const hasAudio = !!memo?.audioUri;
    const hasImage = !!memo?.imageUri;

    // AI Speech Checker
    const [isRecordingSpeech, setIsRecordingSpeech] = useState(false);
    const [isCheckingSpeech, setIsCheckingSpeech] = useState(false);
    const [speechResult, setSpeechResult] = useState<{score: number, feedback: string} | null>(null);
    const speechRecordingRef = useRef<Audio.Recording | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    // mutable ref so handleCount always reads fresh value (no stale closure)
    const doneRef = useRef(done);

    // Swipe-down-to-dismiss (when done)
    const swipeY = useRef(new Animated.Value(0)).current;
    const swipePan = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, gs) => gs.dy > 12 && Math.abs(gs.dy) > Math.abs(gs.dx),
        onPanResponderMove: (_, gs) => { if (gs.dy > 0) swipeY.setValue(gs.dy * 0.5); },
        onPanResponderRelease: (_, gs) => {
            if (gs.dy > 80) {
                Animated.timing(swipeY, { toValue: 600, duration: 200, useNativeDriver: true }).start(() => handleFinish());
            } else {
                Animated.spring(swipeY, { toValue: 0, useNativeDriver: true }).start();
            }
        },
    })).current;

    // ── Animations ────────────────────────────────────────────────────────────
    // Screen mount
    const mountFade = useRef(new Animated.Value(0)).current;
    const mountSlide = useRef(new Animated.Value(18)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(mountFade, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.spring(mountSlide, { toValue: 0, useNativeDriver: true, ...anim.spring }),
        ]).start();
    }, []);

    // Animated progress bar
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pct = maxCount > 1 ? count / maxCount : done ? 1 : 0;
    useEffect(() => {
        Animated.spring(progressAnim, { toValue: pct, useNativeDriver: false, ...anim.spring }).start();
    }, [pct]);

    // Count button pulse on press
    const countPulse = useRef(new Animated.Value(1)).current;
    const pulseCount = () => {
        Animated.sequence([
            Animated.spring(countPulse, { toValue: 0.94, useNativeDriver: true, ...anim.springS }),
            Animated.spring(countPulse, { toValue: 1, useNativeDriver: true, ...anim.spring }),
        ]).start();
    };

    // Done checkmark bounce
    const checkScale = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (done) Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 5 }).start();
        else checkScale.setValue(0);
    }, [done]);

    // Favorite Star Animation
    const starRotation = useRef(new Animated.Value(0)).current;
    const handleToggleFavorite = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.sequence([
            Animated.timing(starRotation, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(starRotation, { toValue: 0, duration: 150, useNativeDriver: true })
        ]).start();
        await toggleFavorite(memoId);
    };
    const spin = starRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'] // 180 flip effect
    });

    // Image pinch-to-zoom — handled by ImageViewer cleanly now
    const [imageModal, setImageModal] = useState(false);
    const openImageModal = () => setImageModal(true);

    useEffect(() => { if (!done) saveLearningProgress(memoId, count); }, [count]);
    useEffect(() => { if (hasAudio && !done) playAudio(); return () => { stopAudio(); }; }, [count]);
    useEffect(() => () => { soundRef.current?.unloadAsync(); }, []);

    const stopAudio = async () => {
        if (soundRef.current) {
            try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch { }
            soundRef.current = null;
        }
        setIsPlaying(false);
    };
    const playAudio = async () => {
        if (!memo?.audioUri) return;
        await stopAudio(); setAudioDone(false); setPlayProg(0);
        try {
            const { sound } = await Audio.Sound.createAsync({ uri: memo.audioUri }, { shouldPlay: true, rate: speed, shouldCorrectPitch: true });
            soundRef.current = sound; setIsPlaying(true);
            sound.setOnPlaybackStatusUpdate((st: any) => {
                if (!st.isLoaded) return;
                if (st.durationMillis && st.positionMillis) setPlayProg(st.positionMillis / st.durationMillis);
                if (st.didJustFinish) { setIsPlaying(false); setAudioDone(true); setPlayProg(0); }
            });
        } catch { setAudioDone(true); }
    };
    const togglePlay = async () => {
        if (!soundRef.current) { playAudio(); return; }
        const st = await soundRef.current.getStatusAsync() as any;
        if (!st.isLoaded) { playAudio(); return; }
        if (st.isPlaying) { await soundRef.current.pauseAsync(); setIsPlaying(false); }
        else { await soundRef.current.setRateAsync(speed, true); await soundRef.current.playAsync(); setIsPlaying(true); }
    };
    const changeSpeed = async (sp: number) => {
        setSpeed(sp);
        if (soundRef.current) try { await soundRef.current.setRateAsync(sp, true); } catch { }
    };

    const canCount = hasAudio ? audioFinished : true;

    const handleCount = () => {
        if (!canCount || doneRef.current) return; // already completed
        pulseCount();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newCount = count + 1;
        setRevealed(false);

        // Every click is a repetition! Increment stats immediately.
        incrementTotalReps(1);
        incrementMemoReps(memoId, 1);

        if (newCount >= maxCount) {
            // Last rep — mark done and celebrate
            doneRef.current = true;
            setCount(maxCount);
            setDone(true);
            
            if (!isReviewMode) {
                completeLearning(memoId);
            } else {
                // If the user is manually reinforcing a learned/mastered memo, 
                // we shouldn't wipe its reviewCount by strictly calling completeLearning.
                // We'll just refresh its lastReviewedAt silently or call completeReview to step it up!
                completeReview(memoId);
            }
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (!isReviewMode) {
                setShowCelebration(true);
            } else {
                stopAudio();
                // We do not auto-exit here, to give the user time to see the "Done" buttons
                // like Generate Questions or Manual Back.
            }
        } else {
            setCount(newCount);
        }
    };

    const handleFinish = () => {
        stopAudio();
        navigation.goBack();
    };

    const handleReinforce = () => {
        setCount(0);
        setDone(false);
        setRevealed(false);
        incrementMemoReps(memoId, 1);
    };

    // AI Speech Checker Logic
    const toggleSpeechCheck = async () => {
        if (isRecordingSpeech) {
            stopRecordingSpeech();
        } else {
            startRecordingSpeech();
        }
    };

    const startRecordingSpeech = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            speechRecordingRef.current = recording;
            setIsRecordingSpeech(true);
            setSpeechResult(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            showAlert({ title: 'خطأ', message: 'تعذر بدء التسجيل الصوتي' });
        }
    };

    const stopRecordingSpeech = async () => {
        setIsRecordingSpeech(false);
        if (!speechRecordingRef.current) return;
        try {
            await speechRecordingRef.current.stopAndUnloadAsync();
            const uri = speechRecordingRef.current.getURI();
            speechRecordingRef.current = null;
            if (uri && memo?.text) {
                const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                evaluateSpeech(b64, 'audio/m4a', memo.text);
            }
        } catch (err) {}
    };

    const evaluateSpeech = async (base64Audio: string, mimeType: string, expectedText: string) => {
        setIsCheckingSpeech(true);
        try {
            const result = await checkSpeechAgainstText(base64Audio, mimeType, expectedText);
            setSpeechResult(result);
            if (result.score >= 80) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        } catch (err: any) {
            showAlert({ title: 'خطأ', message: err.message || 'فشل تقييم التسميع الصوتي' });
        } finally {
            setIsCheckingSpeech(false);
        }
    };

    if (!memo) return <View style={s.root} />;

    const displayText = tashkeeledText ?? memo.text;
    const isPoetry = displayText.includes(' --- ');
    const words = displayText.split(/(\s+)/);
    const textFontSize = 24 * fontSizeScale;

    // ── Pre-compute anyHidden so toolbar can show/hide reveal button ──────────
    let anyHidden = false;
    if (vanishMode !== 'none' && count > 0) {
        if (vanishMode === 'all' && count >= vanishAllAfter) anyHidden = true;
        else if (vanishMode === 'words')
            anyHidden = words.some((w, i) => w.trim() && i % (maxCount + 2 - (count % maxCount)) === 0);
        else if (vanishMode === 'opacity') anyHidden = true;
    }

    // ── Tashkeel handler ──────────────────────────────────────────────────────
    const applyTashkeel = async () => {
        if (tashkeeledText) { setTashkeeledText(null); return; }
        setIsLoadingTashkeel(true);
        try {
            const result = await addTashkeelToText(memo.text);
            setTashkeeledText(result);
        } catch (e: any) {
            showAlert({ title: 'خطأ', message: e.message || 'فشل التشكيل' });
        } finally { setIsLoadingTashkeel(false); }
    };

    // Word span for vanish mode — rendered inside a View (not a parent Text)
    // In a globally-RTL app, flexDirection:'row' flows right-to-left, so word[0] is on the RIGHT
    const renderWordSpan = (word: string, i: number, fontSize: number, isNested: boolean = false): React.ReactNode => {
        let spanColor = '#fdfbfe';
        if (vanishMode !== 'none' && !revealed && count > 0) {
            if (vanishMode === 'all' && count >= vanishAllAfter) {
                spanColor = 'rgba(255,255,255,0.06)';
            } else if (vanishMode === 'words' && i % (maxCount + 2 - (count % maxCount)) === 0) {
                spanColor = 'rgba(255,255,255,0.06)';
            } else if (vanishMode === 'opacity') {
                const opVal = Math.max(0.1, 1 - count / maxCount);
                spanColor = `rgba(253, 251, 254, ${opVal.toFixed(2)})`;
            }
        }
        return (
            <Text key={i} style={{ 
                fontFamily: currentFontFamily, 
                color: spanColor, 
                fontSize, 
                marginHorizontal: fontSize * 0.15,
                marginVertical: fontSize * 0.1,
                ...(isNested ? {} : { lineHeight: fontSize * 2.1 }) 
            }}>
                {word}
            </Text>
        );
    };
    // For poetry rendering (nested inline Text)
    const renderInlineWord = (word: string, i: number, fontSize: number) => renderWordSpan(word, i, fontSize, true);

    const renderPoetry = () => {
        const pFont = Math.max(13, Math.round(18 * fontSizeScale));
        const lines = memo.text.split('\n').filter(l => l.trim());
        let gIdx = 0;
        return (
            <View style={{ gap: 2 }}>
                {lines.map((lineText, lineIdx) => {
                    const parts = lineText.split(' --- ');
                    const firstPart = parts[0] || '';
                    const numMatch = firstPart.match(/^(\d+)-\s*/);
                    const numLabel = numMatch ? numMatch[1] : String(lineIdx + 1);
                    const sadrText = firstPart.replace(/^\d+-\s*/, '').trim();
                    const ajzText = (parts[1] || '').trim();
                    const sadrWords = sadrText ? sadrText.split(/\s+/).filter(Boolean) : [];
                    const ajzWords = ajzText ? ajzText.split(/\s+/).filter(Boolean) : [];
                    const sadrStart = gIdx; gIdx += sadrWords.length;
                    const ajzStart = gIdx;  gIdx += ajzWords.length;
                    return (
                        <View key={`v-${lineIdx}`} style={[s.poetryRow, lineIdx % 2 === 0 && s.poetryRowEven]}>
                            <View style={s.poetryBadge}>
                                <Text style={[s.poetryBadgeNum, { fontSize: Math.max(8, pFont * 0.65) }]}>{numLabel}</Text>
                            </View>
                            <View style={s.poetryHalfWrap}>
                                {sadrWords.map((w, i) => renderWordSpan(w, sadrStart + i, pFont, false))}
                            </View>
                            {ajzText ? (
                                <>
                                    <Text style={[s.poetryOrn, { fontSize: pFont * 0.75 }]}>◈</Text>
                                    <View style={s.poetryHalfWrap}>
                                        {ajzWords.map((w, i) => renderWordSpan(w, ajzStart + i, pFont, false))}
                                    </View>
                                </>
                            ) : null}
                        </View>
                    );
                })}
            </View>
        );
    };

    const imageOpacity = revealed || count === 0 || vanishMode === 'none' ? 1 
                         : vanishMode === 'opacity' ? Math.max(0.2, 1 - (count / maxCount)) 
                         : vanishMode === 'all' && count >= vanishAllAfter ? 0 : 0.4;

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            {/* ── Stitch Header ── */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => { stopAudio(); navigation.goBack(); }} style={s.closeBtn}>
                    <X size={24} color="#ababad" strokeWidth={2} />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle} numberOfLines={1}>{memo.title}</Text>
                    <Text style={s.headerSub}>{t('learn.repCount').replace('{{count}}', String(count)).replace('{{max}}', String(maxCount))}</Text>
                </View>
                <View style={s.headerRight}>
                    {totalReps > 0 && (
                        <View style={s.streakBadge}>
                            <Award size={12} color="#CCFF00" strokeWidth={2.5} />
                            <Text style={s.streakText}>{totalReps}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={handleToggleFavorite} style={{ padding: 4 }}>
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Star size={20} color={memo?.isFavorite ? "#CCFF00" : "#ababad"} fill={memo?.isFavorite ? "#CCFF00" : "transparent"} strokeWidth={2} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Progress Bar ── */}
            <View style={s.progressWrap}>
                <Animated.View style={[s.progressFill, { 
                    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                }]} />
            </View>

            <ScrollView 
                style={s.flex} 
                contentContainerStyle={s.scrollPad}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                <Animated.View style={{ opacity: mountFade, transform: [{ translateY: mountSlide }], gap: 20 }}>
                    
                    {/* ── Audio Player (if exists) ── */}
                    {hasAudio && (
                        <View style={s.audioCard}>
                            <TouchableOpacity style={s.playBtn} onPress={togglePlay}>
                                {isPlaying
                                    ? <Pause size={16} color="#0d0e10" strokeWidth={2.5} />
                                    : <Play size={16} color="#0d0e10" strokeWidth={2.5} />}
                            </TouchableOpacity>
                            <View style={s.audioTrack}>
                                <Animated.View style={[s.audioFill, { width: `${playProg * 100}%` }]} />
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.spdRow}>
                                {SPEED_OPTIONS.map(sp => (
                                    <TouchableOpacity key={sp} style={[s.spd, speed === sp && s.spdOn]} onPress={() => changeSpeed(sp)}>
                                        <Text style={[s.spdText, speed === sp && s.spdTextOn]}>{sp}x</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* ── Image (if exists) ── */}
                    {hasImage && (
                        <TouchableOpacity
                            style={[s.imgCont, { opacity: imageOpacity }]}
                            onPress={() => {
                                if (imageOpacity < 1) {
                                    showAlert({
                                        title: 'إظهار الصورة',
                                        message: 'هل تريد كشف المحفوظ لرؤية الصورة الكاملة؟',
                                        buttons: [
                                            { text: 'إلغاء', style: 'cancel' },
                                            { text: 'كشف', onPress: () => { setRevealed(true); openImageModal(); } },
                                        ],
                                    });
                                } else {
                                    openImageModal();
                                }
                            }}
                            activeOpacity={0.9}
                        >
                            <Image source={{ uri: memo.imageUri }} style={s.img} resizeMode="contain" />
                            <View style={s.imgHint}><ZoomIn size={14} color="#0d0e10" strokeWidth={2} /><Text style={s.imgHintText}>تكبير</Text></View>
                        </TouchableOpacity>
                    )}

                    {/* ── Glass Vanish Card ── */}
                    <GestureDetector gesture={pinchGesture}>
                        <View style={s.glassCard}>
                            {/* ── Toolbar: zoom · font · tashkeel · reveal ── */}
                            <View style={s.toolbar}>
                                <TouchableOpacity style={s.toolBtn} onPress={() => updateMemoPrefs(memoId, { fontSizeScale: parseFloat(Math.max(0.6, fontSizeScale - 0.15).toFixed(2)) })}>
                                    <ZoomOut size={14} color="#CCFF00" strokeWidth={2} />
                                </TouchableOpacity>
                                <Text style={s.toolHint}>{Math.round(fontSizeScale * 100)}%</Text>
                                <TouchableOpacity style={s.toolBtn} onPress={() => updateMemoPrefs(memoId, { fontSizeScale: parseFloat(Math.min(2.0, fontSizeScale + 0.15).toFixed(2)) })}>
                                    <ZoomIn size={14} color="#CCFF00" strokeWidth={2} />
                                </TouchableOpacity>
                                <View style={s.toolDivider} />
                                {/* Font cycler — full name fits now that padding is reduced */}
                                <TouchableOpacity style={[s.toolBtn, { width: 'auto', paddingHorizontal: 8 }]} onPress={cycleFont}>
                                    <Text style={{ fontFamily: currentFontFamily, fontSize: 11, color: '#CCFF00', lineHeight: 16 }}>
                                        {FONTS[fontIdx].hint}
                                    </Text>
                                </TouchableOpacity>
                                {/* AI Tashkeel */}
                                <TouchableOpacity style={[s.toolBtn, tashkeeledText != null && s.toolBtnOn]} onPress={applyTashkeel} disabled={isLoadingTashkeel}>
                                    {isLoadingTashkeel
                                        ? <Loader size={13} color="#CCFF00" />
                                        : <Text style={[s.toolLabel, tashkeeledText != null && s.toolLabelOn]}>تشكيل</Text>}
                                </TouchableOpacity>
                                {/* Reveal hidden */}
                                {anyHidden && !done && (
                                    <TouchableOpacity style={[s.toolBtn, revealed && s.toolBtnOn]} onPress={() => setRevealed(r => !r)}>
                                        {revealed ? <EyeOff size={14} color="#0d0e10" strokeWidth={2} /> : <Eye size={14} color="#CCFF00" strokeWidth={2} />}
                                    </TouchableOpacity>
                                )}
                                <View style={s.toolDivider} />
                                {/* Edit memo */}
                                <TouchableOpacity
                                    style={s.toolBtn}
                                    onPress={() => { stopAudio(); navigation.navigate('AddMemo', { editId: memoId }); }}
                                >
                                    <Pencil size={13} color="#CCFF00" strokeWidth={2} />
                                </TouchableOpacity>
                            </View>
                            {isPoetry
                                ? renderPoetry()
                                : (() => {
                                    const isVanishActive = vanishMode !== 'none' && !revealed && count > 0;
                                        if (!isVanishActive) {
                                            // Single string — guaranteed correct Arabic RTL rendering
                                            return (
                                                <Text style={{
                                                    width: '100%',
                                                    fontFamily: currentFontFamily,
                                                    fontSize: textFontSize,
                                                    lineHeight: textFontSize * 2.1,
                                                    color: '#fdfbfe',
                                                    textAlign: I18nManager.isRTL ? 'left' : 'right',
                                                    writingDirection: 'rtl',
                                                }}>
                                                    {displayText}
                                                </Text>
                                            );
                                        }
                                        // Vanish mode: View with flexDirection:'row'
                                        // Preserves paragraph breaks (\n) which were previously stripped by split(/\s+/)
                                        let globalWordIdx = 0;
                                        return (
                                            <View style={{ width: '100%', gap: 4 }}>
                                                {displayText.split('\n').map((lineText, lineIdx) => {
                                                    const lineWords = lineText.split(/\s+/).filter(Boolean);
                                                    if (lineWords.length === 0) return <View key={lineIdx} style={{ height: textFontSize }} />; // Preserve empty lines
                                                    return (
                                                        <View key={lineIdx} style={s.wordRow}>
                                                            {lineWords.map((w) => {
                                                                const currentIdx = globalWordIdx++;
                                                                return renderWordSpan(w, currentIdx, textFontSize);
                                                            })}
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        );
                                    })()
                            }
                        </View>
                    </GestureDetector>

                </Animated.View>
            </ScrollView>

            {/* ── Floating Bottom Action Board ── */}
            <View style={s.bottomBoard}>
                {/* AI Speech Result */}
                {speechResult && !done && (
                    <View style={[s.speechScoreBox, speechResult.score >= 80 ? {borderColor: 'rgba(204,255,0,0.4)', backgroundColor: 'rgba(204,255,0,0.05)'} : {borderColor: 'rgba(255,115,81,0.4)', backgroundColor: 'rgba(255,115,81,0.05)'}]}>
                        <View style={s.speechScoreHeader}>
                            <Text style={[s.speechScorePct, speechResult.score >= 80 ? {color: '#CCFF00'} : {color: '#ff7351'}]}>التطابق: %{speechResult.score}</Text>
                            <Sparkles size={16} color={speechResult.score >= 80 ? "#CCFF00" : "#ff7351"} />
                        </View>
                        <Text style={s.speechFeedbackText} numberOfLines={2}>{speechResult.feedback}</Text>
                    </View>
                )}

                {!done ? (
                    <View style={s.actionRow}>
                        {/* Mic Button */}
                        {!hasAudio && (
                            <TouchableOpacity style={[s.micBtn, isRecordingSpeech && s.micBtnRec]} onPress={toggleSpeechCheck} disabled={isCheckingSpeech}>
                                {isCheckingSpeech ? <Loader size={20} color="#0d0e10" /> : (
                                    isRecordingSpeech ? <MicOff size={20} color="#0d0e10" /> : <Mic size={20} color="#0d0e10" />
                                )}
                            </TouchableOpacity>
                        )}
                        {/* Count Button */}
                        <Animated.View style={[{ flex: 1 }, { transform: [{ scale: countPulse }] }]}>
                            <TouchableOpacity
                                style={[s.countBtn, !canCount && s.countBtnOff]}
                                onPress={handleCount} activeOpacity={0.9}
                                disabled={!canCount}
                            >
                                <Text style={s.countBtnText}>{canCount ? `سجل تكرار (${count}/${maxCount})` : 'يجب سماع المقطع أولاً'}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                ) : isReviewMode ? (
                    <View style={{ gap: 10 }}>
                        <TouchableOpacity style={s.doneBtn} onPress={() => { stopAudio(); navigation.replace('QuizSetup', { preSelectedId: memoId }); }} activeOpacity={0.88}>
                            <Sparkles size={24} color="#0d0e10" strokeWidth={2} />
                            <Text style={s.doneBtnText}>{t('learn.generateQuiz')}</Text>
                        </TouchableOpacity>
                        
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={[s.exitBtn, { flex: 1 }]} onPress={() => { stopAudio(); navigation.goBack(); }}>
                                <LogOut size={18} color="#ababad" strokeWidth={1.5} />
                                <Text style={s.exitText}>{t('common.back')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[s.exitBtn, { flex: 1.5, borderColor: 'rgba(204,255,0,0.2)', backgroundColor: 'rgba(204,255,0,0.05)' }]} 
                                onPress={handleReinforce}
                            >
                                <RotateCcw size={18} color="#CCFF00" strokeWidth={1.5} />
                                <Text style={[s.exitText, { color: '#CCFF00' }]}>{t('settings.reinforceReps')} ({settings.reinforceRepetitions}x)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={{ gap: 10 }}>
                        {/* Next chain portion banner */}
                        {nextChainMemo && (
                            <TouchableOpacity
                                style={s.nextPartBtn}
                                onPress={() => {
                                    stopAudio();
                                    navigation.replace('Learn', { memoId: nextChainMemo.id });
                                }}
                                activeOpacity={0.85}
                            >
                                <View style={s.nextPartIcon}>
                                    <Text style={s.nextPartNum}>{nextChainMemo.partNumber ?? '?'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.nextPartLabel}>الجزء التالي من السلسلة</Text>
                                    <Text style={s.nextPartTitle} numberOfLines={1}>{nextChainMemo.title}</Text>
                                </View>
                                <View style={s.nextPartArrow}>
                                    <Text style={{ color: '#CCFF00', fontSize: 18 }}>{'<'}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={s.doneBtn} onPress={handleFinish} activeOpacity={0.88}>
                            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                                <CheckCircle size={24} color="#0d0e10" strokeWidth={2} />
                            </Animated.View>
                            <Text style={s.doneBtnText}>{t('learn.sessionDone')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Modals & Overlays */}
            <Modal visible={imageModal} transparent animationType="fade" onRequestClose={() => setImageModal(false)}>
                <View style={s.modalBg}>
                    <TouchableOpacity style={s.modalClose} onPress={() => setImageModal(false)}>
                        <X size={24} color="#fff" strokeWidth={2} />
                    </TouchableOpacity>
                    <ImageViewer
                        imageUrls={[{ url: memo?.imageUri || '' }]}
                        enableSwipeDown
                        onSwipeDown={() => setImageModal(false)}
                        onCancel={() => setImageModal(false)}
                        renderIndicator={() => <View />}
                        backgroundColor="transparent"
                        style={{ width: SW, height: SH }}
                        menus={() => <View />}
                    />
                    
                    {/* Floating Actions Over Image */}
                    <View style={s.modalBottomOverlay}>
                        {!done ? (
                            <View style={[s.actionRow, { backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 24 }]}>
                                {!hasAudio && (
                                    <TouchableOpacity style={[s.micBtn, isRecordingSpeech && s.micBtnRec, { width: 50, height: 50 }]} onPress={toggleSpeechCheck} disabled={isCheckingSpeech}>
                                        {isCheckingSpeech ? <Loader size={16} color="#0d0e10" /> : (
                                            isRecordingSpeech ? <MicOff size={16} color="#0d0e10" /> : <Mic size={16} color="#0d0e10" />
                                        )}
                                    </TouchableOpacity>
                                )}
                                <Animated.View style={[{ flex: 1 }, { transform: [{ scale: countPulse }] }]}>
                                    <TouchableOpacity
                                        style={[s.countBtn, !canCount && s.countBtnOff, { minHeight: 50 }]}
                                        onPress={handleCount} activeOpacity={0.9}
                                        disabled={!canCount}
                                    >
                                        <Text style={s.countBtnText}>{canCount ? `تكرار (${count}/${maxCount})` : 'اسمع أولاً'}</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        ) : (
                            <TouchableOpacity style={[s.doneBtn, { shadowColor: '#CCFF00', shadowOpacity: 0.3, shadowRadius: 10 }]} onPress={() => { setImageModal(false); if(isReviewMode) { navigation.replace('QuizSetup', { preSelectedId: memoId }); } else { handleFinish(); } }} activeOpacity={0.88}>
                                <CheckCircle size={20} color="#0d0e10" strokeWidth={2} />
                                <Text style={s.doneBtnText}>{isReviewMode ? t('learn.generateQuiz') : t('learn.sessionDone')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
            <CelebrationOverlay 
                visible={showCelebration} 
                onFinish={() => setShowCelebration(false)} 
            />
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1 },
    scrollPad: { paddingHorizontal: 8, paddingTop: 16, paddingBottom: 160 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
    headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: '#fdfbfe', textAlign: 'center' },
    headerSub: { fontFamily: 'Cairo_500Medium', fontSize: 11, color: '#ababad', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    headerRight: { minWidth: 40, alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)' },
    streakText: { fontFamily: 'Cairo_700Bold', fontSize: 11, color: '#CCFF00' },

    // Progress
    progressWrap: { height: 2, backgroundColor: 'rgba(255,255,255,0.04)', width: '100%' },
    progressFill: { height: 2, backgroundColor: '#CCFF00' },

    // Audio
    audioCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CCFF00', alignItems: 'center', justifyContent: 'center' },
    audioTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
    audioFill: { height: 6, backgroundColor: '#CCFF00', borderRadius: 3 },
    spdRow: { gap: 6, paddingRight: 6 },
    spd: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
    spdOn: { backgroundColor: '#CCFF00' },
    spdText: { fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: '#ababad' },
    spdTextOn: { color: '#0d0e10' },

    // Image
    imgCont: { width: '100%', minHeight: 250, height: Math.min(400, Dimensions.get('window').height * 0.6), borderRadius: 20, overflow: 'hidden', backgroundColor: '#181a1c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative' },
    img: { width: '100%', height: '100%' },
    imgHint: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CCFF00', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    imgHintText: { fontFamily: 'Cairo_700Bold', fontSize: 11, color: '#0d0e10' },

    glassCard: { flex: 1, backgroundColor: 'transparent', padding: 16 },
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    toolBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    toolBtnOn: { backgroundColor: 'rgba(204,255,0,0.15)' },
    toolHint: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: '#ababad' },
    toolDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
    toolLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: '#ababad' },
    toolLabelOn: { color: '#CCFF00' },
    wordRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    poetryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
    poetryRowEven: { backgroundColor: 'transparent' },
    poetryBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(204,255,0,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    poetryBadgeNum: { fontFamily: 'Cairo_700Bold', color: '#CCFF00' },
    poetryHalfWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    poetryOrn: { fontFamily: 'Amiri_400Regular', color: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
    bottomBoard: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, gap: 12, backgroundColor: '#111214', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
    speechScoreBox: { padding: 12, borderRadius: 16, borderWidth: 1 },
    speechScoreHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    speechScorePct: { fontFamily: 'Cairo_700Bold', fontSize: 13 },
    speechFeedbackText: { fontFamily: 'Cairo_500Medium', fontSize: 11, color: '#ababad', textAlign: 'right' },
    actionRow: { flexDirection: 'row', gap: 12 },
    micBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#CCFF00', alignItems: 'center', justifyContent: 'center' },
    micBtnRec: { backgroundColor: '#ff7351' },
    countBtn: { flex: 1, height: 56, borderRadius: 28, backgroundColor: '#CCFF00', alignItems: 'center', justifyContent: 'center' },
    countBtnOff: { backgroundColor: 'rgba(255,255,255,0.1)', opacity: 0.5 },
    countBtnText: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: '#0d0e10' },
    doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 28, backgroundColor: '#CCFF00' },
    doneBtnText: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: '#0d0e10' },
    exitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    exitText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: '#ababad' },
    nextPartBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(204,255,0,0.08)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)' },
    nextPartIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#CCFF00', alignItems: 'center', justifyContent: 'center' },
    nextPartNum: { fontFamily: 'Cairo_700Bold', fontSize: 13, color: '#0d0e10' },
    nextPartLabel: { fontFamily: 'Cairo_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
    nextPartTitle: { fontFamily: 'Cairo_700Bold', fontSize: 14, color: '#fdfbfe' },
    nextPartArrow: { width: 24, alignItems: 'center' },
    modalBg: { flex: 1, backgroundColor: '#0d0e10' },
    modalClose: { position: 'absolute', top: 40, left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    modalBottomOverlay: { position: 'absolute', bottom: 40, left: 20, right: 20, zIndex: 10 },
});
""")

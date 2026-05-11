/**
 * AddMemoScreen — Create or edit a memo.
 *
 * Rules:
 * - <MText> always, no raw <Text>
 * - colors.* / typography.* / fonts.* / spacing.* / radius.*
 * - RTL: row, textAlign:'right'
 * - Haptics on every interactive press
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import Input from '@/shared/ui/Input';
import { X, Link, Camera, Mic, Play, Trash } from 'lucide-react-native';
import { useSettingsStore } from '../../settings/store/settings.store';
import { useMemoStore } from '../store/memo.store';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import AudioWaveform from '@/shared/ui/AudioWaveform';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddMemoScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AddMemoScreen'>>();
  const navigation = useNavigation<NavProp>();
  const { memos, addMemo, updateMemo } = useMemoStore();
  const { settings } = useSettingsStore();

  const isEditing = !!route.params?.memoId;
  const existingMemo = isEditing ? memos.find(m => m.id === route.params!.memoId) : null;

  const [title, setTitle] = useState(existingMemo?.title || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    existingMemo?.tags || [],
  );

  const [isLinked, setIsLinked] = useState(!!existingMemo?.related_memo_id);
  const [relatedMemoId, setRelatedMemoId] = useState(existingMemo?.related_memo_id || '');

  const [isPoetry, setIsPoetry] = useState(existingMemo?.is_poem || false);
  const [text, setText] = useState(existingMemo?.text || '');
  const [firstHemistich, setFirstHemistich] = useState('');
  const [secondHemistich, setSecondHemistich] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPoetry && existingMemo?.text) {
      const parts = existingMemo.text.split(' *** ');
      if (parts.length === 2) {
        setFirstHemistich(parts[0]);
        setSecondHemistich(parts[1]);
      } else {
        setFirstHemistich(existingMemo.text);
      }
    }
  }, [isPoetry, existingMemo]);

  const [imageUrl, setImageUrl] = useState(existingMemo?.image_url || '');
  const [audioUrl, setAudioUrl] = useState(existingMemo?.audio_url || '');

  // Audio Recording State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Keep a stable ref so cleanup functions can reach the latest instances
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const recordingRef = React.useRef<Audio.Recording | null>(null);

  // Sync refs with state
  useEffect(() => { soundRef.current = sound; }, [sound]);
  useEffect(() => { recordingRef.current = recording; }, [recording]);

  // Cleanup on unmount — unload sound and stop any active recording
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('إذن مرفوض', 'يرجى السماح بالوصول إلى الميكروفون من الإعدادات');
        return;
      }
      // Stop any playing sound first
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        setSound(null);
        setIsPlaying(false);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(newRecording);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('خطأ', 'فشل بدء التسجيل. تحقق من صلاحيات الميكروفون.');
    }
  }

  async function stopRecording() {
    // Capture local ref BEFORE clearing state to avoid null-ref race condition
    const activeRecording = recordingRef.current;
    if (!activeRecording) return;
    setRecording(null);
    try {
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      setAudioUrl(uri || '');
    } catch (err) {
      console.error('Failed to stop recording', err);
    } finally {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function playSound() {
    if (!audioUrl) return;
    // Unload any previously loaded sound first
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      setSound(null);
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
    } catch (err) {
      console.error('Failed to play sound', err);
      setIsPlaying(false);
      Alert.alert('خطأ', 'فشل تشغيل الصوت.');
    }
  }

  async function stopSound() {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
    }
    setIsPlaying(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const toggleCategory = (cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', 'يرجى إدخال العنوان');
      return;
    }

    let finalContent = '';
    if (isPoetry) {
      if (!firstHemistich.trim() && !secondHemistich.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('خطأ', 'يرجى إدخال النص');
        return;
      }
      finalContent = `${firstHemistich} *** ${secondHemistich}`;
    } else {
      if (!text.trim() && !imageUrl && !audioUrl) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('خطأ', 'يرجى إدخال نص أو إضافة وسائط');
        return;
      }
      finalContent = text;
    }

    const payload = {
      title,
      text: finalContent,
      label: selectedCategories[0] || 'بدون تصنيف',
      tags: selectedCategories,
      is_poem: isPoetry,
      related_memo_id: isLinked ? relatedMemoId : null,
      audio_url: audioUrl,
      image_url: imageUrl,
      stage: 'LEARNING' as const,
      review_count: 0,
      repetition_count: 0,
      is_favorite: existingMemo?.is_favorite || false,
    };

    setSaving(true);
    try {
      if (isEditing && existingMemo) {
        // ── Edit: ONLY update content fields — NEVER touch stage/progress
        await updateMemo(existingMemo.id, {
          title,
          text: finalContent,
          label: selectedCategories[0] || 'بدون تصنيف',
          tags: selectedCategories,
          is_poem: isPoetry,
          related_memo_id: isLinked ? relatedMemoId : null,
          audio_url: audioUrl,
          image_url: imageUrl,
          // stage / review_count / repetition_count are intentionally NOT overwritten
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        const newMemo = await addMemo({
          title,
          text: finalContent,
          label: selectedCategories[0] || 'بدون تصنيف',
          tags: selectedCategories,
          is_poem: isPoetry,
          related_memo_id: isLinked ? relatedMemoId : null,
          audio_url: audioUrl,
          image_url: imageUrl,
          // New memos always start LEARNING at 0
          stage: 'LEARNING' as const,
          review_count: 0,
          repetition_count: 0,
          is_favorite: false,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // ✓ New memos are LEARNING stage — navigate to LearningSession
        navigation.replace('LearningSessionScreen', { memoId: newMemo.id });
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MahfodPatternBackground />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <MText weight="bold" style={styles.headerTitle}>
            {isEditing ? 'تعديل المحفوظ' : 'محفوظ جديد'}
          </MText>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* TITLE */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Input
              label="العنوان"
              placeholder="أدخل عنوان المحفوظ"
              value={title}
              onChangeText={setTitle}
            />
          </Animated.View>

          <View style={styles.spacer} />

          {/* CATEGORIES */}
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <MText weight="semi" style={styles.sectionLabel}>
              التصنيفات (يمكن اختيار أكثر من واحد)
            </MText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {settings.categories.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <MText
                      weight={isSelected ? 'bold' : 'regular'}
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                    >
                      {cat}
                    </MText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          <View style={styles.spacer} />

          {/* LINK CHAIN */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.darkCard}>
            <View style={styles.rowReverse}>
              <View style={styles.rowReverse}>
                <Link color={colors.textMuted} size={20} style={{ marginLeft: spacing.sm }} />
                <View>
                  <MText weight="semi" style={styles.cardTitle}>ربط بسلسلة</MText>
                  <MText weight="regular" style={styles.cardSubtext}>
                    اضغط لإضافة هذا المحفوظ كجزء من متن أطول
                  </MText>
                </View>
              </View>
              <Switch
                value={isLinked}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsLinked(v);
                }}
                trackColor={{ true: colors.accent, false: colors.surfaceBright }}
              />
            </View>
            {isLinked && (
              <View style={{ marginTop: spacing.sm }}>
                {/* TODO: Replace with a memo-picker modal once implemented */}
                <View style={styles.comingSoonChip}>
                  <MText weight="regular" style={styles.comingSoonText}>
                    اختيار المحفوظ المرتبط — قريباً
                  </MText>
                </View>
              </View>
            )}
          </Animated.View>

          <View style={styles.spacer} />

          {/* TEXT */}
          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <View style={styles.rowReverseBetween}>
              <MText weight="semi" style={styles.sectionLabel}>النص</MText>
              <View style={styles.rowReverse}>
                <MText weight="semi" style={[styles.sectionLabel, { marginBottom: 0, marginLeft: spacing.sm }]}>
                  شعر (شطرين)
                </MText>
                <Switch
                  value={isPoetry}
                  onValueChange={(v) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsPoetry(v);
                  }}
                  trackColor={{ true: colors.accent, false: colors.surfaceBright }}
                />
              </View>
            </View>

            {isPoetry ? (
              <View style={styles.poetryContainer}>
                <Input placeholder="الصدر..." value={firstHemistich} onChangeText={setFirstHemistich} />
                <View style={styles.divider} />
                <Input placeholder="العجز..." value={secondHemistich} onChangeText={setSecondHemistich} />
              </View>
            ) : (
              <Input
                multiline
                minHeight={120}
                placeholder="أدخل نص المتن أو الشعر أو الحديث..."
                value={text}
                onChangeText={setText}
              />
            )}
          </Animated.View>

          <View style={styles.spacer} />

          {/* MEDIA */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <MText weight="semi" style={[styles.sectionLabel, { color: colors.textMuted }]}>
              الوسائط (اختياري)
            </MText>
            <View style={styles.mediaRow}>
              <TouchableOpacity style={styles.mediaCard}>
                {imageUrl ? (
                  <View style={styles.mediaPreview}>
                    <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} />
                    <TouchableOpacity style={styles.removeMediaOverlay} onPress={() => setImageUrl('')}>
                      <X color={colors.white} size={24} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Camera color={colors.textMuted} size={28} />
                    <MText weight="regular" style={styles.mediaText}>إضافة صورة</MText>
                  </>
                )}
              </TouchableOpacity>

              <View style={[styles.mediaCard, { overflow: 'hidden' }]}>
                {audioUrl ? (
                  <>
                    <TouchableOpacity
                      onPress={isPlaying ? stopSound : playSound}
                      style={{ alignItems: 'center' }}
                    >
                      {isPlaying ? (
                        <AudioWaveform isActive={true} />
                      ) : (
                        <Play color={colors.accent} size={28} />
                      )}
                      <MText weight="regular" style={styles.mediaText}>
                        {isPlaying ? 'إيقاف' : 'تشغيل الصوت'}
                      </MText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 10 }}
                      onPress={() => setAudioUrl('')}
                    >
                      <Trash color={colors.error} size={16} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={recording ? stopRecording : startRecording}
                    style={{ alignItems: 'center' }}
                  >
                    {recording ? (
                      <AudioWaveform isActive={true} />
                    ) : (
                      <Mic color={colors.textMuted} size={28} />
                    )}
                    <MText
                      weight="regular"
                      style={[styles.mediaText, recording && { color: colors.error }]}
                    >
                      {recording ? 'إيقاف التسجيل' : 'تسجيل'}
                    </MText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* ── Sticky bottom CTA ── */}
        <View style={styles.stickyBottom}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <MText weight="bold" style={styles.saveBtnText}>
                {isEditing ? 'حفظ التعديلات' : 'ابدإ التكرار'}
              </MText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
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
  scroll: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  spacer: {
    height: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'left',
    marginBottom: spacing.sm,
  },
  chipScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  darkCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowReverse: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowReverseBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.bodySmall,
    fontFamily: fonts.semi,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  cardSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'left',
    marginTop: 2,
  },
  poetryContainer: {
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '50%',
    alignSelf: 'center',
    marginVertical: spacing.xs,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mediaCard: {
    flex: 1,
    height: 100,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  mediaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  removeMediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyBottom: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
    elevation: 8,
  },
  saveBtnText: {
    ...typography.h3,
    color: colors.primary,
  },
  comingSoonChip: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  comingSoonText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

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
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import Input from '@/shared/ui/Input';
import { X, Link, Camera, Mic, Play, Trash } from 'lucide-react-native';
import { useSettingsStore } from '../../settings/store/settings.store';
import { useMemoStore } from '../store/memo.store';
import { useAlertStore } from '@/shared/store/alert.store';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import AudioWaveform from '@/shared/ui/AudioWaveform';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddMemoScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AddMemoScreen'>>();
  const navigation = useNavigation<NavProp>();
  const { memos, addMemo, updateMemo } = useMemoStore();
  const { settings } = useSettingsStore();
  const showAlert = useAlertStore(state => state.showAlert);

  const isEditing = !!route.params?.memoId;
  const existingMemo = isEditing ? memos.find(m => m.id === route.params!.memoId) : null;

  const [title, setTitle] = useState(existingMemo?.title || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    existingMemo?.tags || [],
  );

  const [isLinked, setIsLinked] = useState(!!existingMemo?.related_memo_id);
  const [relatedMemoId, setRelatedMemoId] = useState(existingMemo?.related_memo_id || '');
  const [isMemoPickerOpen, setIsMemoPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMemos = memos.filter(m => 
    m.id !== existingMemo?.id && 
    (m.title.includes(searchQuery) || m.text.includes(searchQuery))
  );

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

  const handleCaptureImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert('خطأ', 'يرجى السماح بالوصول إلى الكاميرا');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert('خطأ', 'يرجى السماح بالوصول إلى المعرض');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleImagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showAlert('إضافة صورة', 'اختر مصدر الصورة', [
      { text: 'التقاط صورة', onPress: handleCaptureImage, style: 'default' },
      { text: 'اختيار من المعرض', onPress: handlePickImage, style: 'default' },
      { text: 'إلغاء', style: 'cancel' }
    ]);
  };

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
        showAlert('إذن مرفوض', 'يرجى السماح بالوصول إلى الميكروفون من الإعدادات');
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
      showAlert('خطأ', 'فشل بدء التسجيل. تحقق من صلاحيات الميكروفون.');
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
      showAlert('خطأ', 'فشل تشغيل الصوت.');
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
      showAlert('خطأ', 'يرجى إدخال العنوان');
      return;
    }

    let finalContent = '';
    if (isPoetry) {
      if (!firstHemistich.trim() && !secondHemistich.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('خطأ', 'يرجى إدخال النص');
        return;
      }
      finalContent = `${firstHemistich} *** ${secondHemistich}`;
    } else {
      if (!text.trim() && !imageUrl && !audioUrl) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('خطأ', 'يرجى إدخال نص أو إضافة وسائط');
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
      showAlert('خطأ', e.message);
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
            <View style={[styles.rowReverse, { alignItems: 'flex-start' }, !isLinked ? { marginBottom: 0 } : undefined]}>
              <Link color={colors.textMuted} size={20} style={{ marginLeft: spacing.md, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <View style={styles.rowReverse}>
                  <MText weight="semi" style={styles.cardTitle}>ربط بسلسلة</MText>
                  <Switch
                    style={{ transform: [{ scale: 0.85 }], marginRight: spacing.sm }}
                    value={isLinked}
                    onValueChange={(v) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsLinked(v);
                    }}
                    trackColor={{ true: colors.accent, false: colors.surfaceBright }}
                    thumbColor={Platform.OS === 'android' ? colors.accent : undefined}
                  />
                </View>
                <MText weight="regular" style={styles.cardSubtext}>
                  اضغط لإضافة هذا المحفوظ كجزء من متن أطول
                </MText>
              </View>
            </View>
            {isLinked && (
              <View style={{ marginTop: spacing.sm }}>
                {relatedMemoId ? (
                  <View style={styles.selectedMemoChip}>
                    <MText weight="semi" style={styles.selectedMemoText} numberOfLines={1}>
                      {memos.find(m => m.id === relatedMemoId)?.title || 'محفوظ مرتبط'}
                    </MText>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setRelatedMemoId('');
                      }}
                      style={styles.clearLinkedMemoBtn}
                    >
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.pickMemoBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsMemoPickerOpen(true);
                    }}
                  >
                    <MText weight="regular" style={styles.pickMemoBtnText}>
                      اضغط لاختيار المحفوظ المرتبط
                    </MText>
                  </TouchableOpacity>
                )}
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
                  style={{ transform: [{ scale: 0.85 }] }}
                  value={isPoetry}
                  onValueChange={(v) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsPoetry(v);
                  }}
                  trackColor={{ true: colors.accent, false: colors.surfaceBright }}
                  thumbColor={Platform.OS === 'android' ? colors.accent : undefined}
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
              <TouchableOpacity style={styles.mediaCard} onPress={handleImagePress}>
                <Camera color={imageUrl ? colors.accent : colors.textMuted} size={28} />
                <MText weight="regular" style={[styles.mediaText, imageUrl ? { color: colors.accent } : undefined]}>
                  {imageUrl ? 'تغيير الصورة' : 'إضافة صورة'}
                </MText>
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
                      style={[styles.mediaText, recording ? { color: colors.error } : undefined]}
                    >
                      {recording ? 'إيقاف التسجيل' : 'تسجيل'}
                    </MText>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {imageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUrl }} style={styles.largeImagePreview} resizeMode="cover" />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUrl('')}>
                  <X color="#FFFFFF" size={20} />
                </TouchableOpacity>
              </View>
            ) : null}
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

      {/* ── Memo Picker Modal ── */}
      <Modal visible={isMemoPickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsMemoPickerOpen(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <MText weight="bold" style={styles.modalTitle}>اختر المحفوظ المرتبط</MText>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsMemoPickerOpen(false)}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearchContainer}>
            <Input
              placeholder="ابحث عن محفوظ..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredMemos}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalMemoItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setRelatedMemoId(item.id);
                  setIsMemoPickerOpen(false);
                }}
              >
                <MText weight="semi" style={styles.modalMemoTitle}>{item.title}</MText>
                <MText weight="regular" style={styles.modalMemoSubtitle}>{item.label}</MText>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <MText weight="regular" style={styles.emptyListText}>لا توجد نتائج</MText>
            }
          />
        </SafeAreaView>
      </Modal>
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
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.subtle,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 140,
  },
  spacer: {
    height: spacing.xl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'left',
    marginBottom: spacing.sm,
  },
  chipScroll: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    ...Shadows.glow,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontFamily: fonts.cairoBold,
  },
  darkCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    ...Shadows.subtle,
  },
  rowReverse: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowReverseBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  cardSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'left',
    marginTop: 4,
  },
  poetryContainer: {
    gap: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.accent,
    width: '40%',
    alignSelf: 'center',
    marginVertical: spacing.sm,
    opacity: 0.5,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  mediaCard: {
    flex: 1,
    height: 110,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  mediaText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: fonts.semi,
  },
  imagePreviewContainer: {
    marginTop: spacing.lg,
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.accent,
    ...Shadows.medium,
  },
  largeImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  stickyBottom: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
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
  selectedMemoChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceHigh, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.accent, ...Shadows.subtle },
  selectedMemoText: { flex: 1, ...typography.body, fontFamily: fonts.semi, color: colors.textPrimary, textAlign: 'left' },
  clearLinkedMemoBtn: { marginLeft: spacing.md, width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  pickMemoBtn: { backgroundColor: colors.surfaceHigh, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', ...Shadows.subtle },
  pickMemoBtnText: { ...typography.body, fontFamily: fonts.semi, color: colors.textPrimary, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: colors.primary },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.accent },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  modalCloseBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.accent },
  modalSearchContainer: { padding: spacing.lg },
  modalList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  modalMemoItem: { backgroundColor: colors.surfaceRaised, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.accent, ...Shadows.subtle },
  modalMemoTitle: { ...typography.body, color: colors.textPrimary, textAlign: 'left', fontFamily: fonts.semi },
  modalMemoSubtitle: { ...typography.caption, color: colors.textMuted, textAlign: 'left', marginTop: 6 },
  emptyListText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});

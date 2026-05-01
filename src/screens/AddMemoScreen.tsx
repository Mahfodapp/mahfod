import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, 
  TouchableOpacity, Switch, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { X, Link, Camera, Mic, Play, Trash } from 'lucide-react-native';
import { useSettingsStore } from '../store/settings.store';
import { useMemoStore } from '../store/memo.store';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import AudioWaveform from '../components/ui/AudioWaveform';

export default function AddMemoScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AddMemoScreen'>>();
  const navigation = useNavigation<any>();
  const { memos, addMemo, updateMemo } = useMemoStore();
  const { settings } = useSettingsStore();

  const isEditing = !!route.params?.memoId;
  const existingMemo = isEditing ? memos.find(m => m.id === route.params!.memoId) : null;

  const [title, setTitle] = useState(existingMemo?.title || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    existingMemo?.tags || []
  );
  
  const [isLinked, setIsLinked] = useState(!!existingMemo?.related_memo_id);
  const [relatedMemoId, setRelatedMemoId] = useState(existingMemo?.related_memo_id || '');
  
  const [isPoetry, setIsPoetry] = useState(existingMemo?.is_poem || false);
  const [text, setText] = useState(existingMemo?.text || '');
  const [firstHemistich, setFirstHemistich] = useState('');
  const [secondHemistich, setSecondHemistich] = useState('');

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

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    setAudioUrl(uri || '');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function playSound() {
    if (!audioUrl) return;
    setIsPlaying(true);
    const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
    setSound(sound);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
    });
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
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

    try {
      if (isEditing && existingMemo) {
        await updateMemo(existingMemo.id, payload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        const newMemo = await addMemo(payload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('ReviewSessionScreen', { memoId: newMemo.id });
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>{isEditing ? "تعديل المحفوظ" : "محفوظ جديد"}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>

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
            <Text style={styles.sectionLabel}>التصنيفات (يمكن اختيار أكثر من واحد)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {settings.categories.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleCategory(cat);
                    }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{cat}</Text>
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
                <Link color={colors.textMuted} size={20} style={{ marginLeft: 8 }} />
                <View>
                  <Text style={styles.cardTitle}>ربط بسلسلة</Text>
                  <Text style={styles.cardSubtext}>اضغط لإضافة هذا المحفوظ كجزء من متن أطول</Text>
                </View>
              </View>
              <Switch 
                value={isLinked} 
                onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsLinked(v); }}
                trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.12)' }}
              />
            </View>
            {isLinked && (
              <View style={{ marginTop: 12 }}>
                <Input 
                  placeholder="ابحث عن محفوظ للربط..." 
                  value={relatedMemoId} 
                  onChangeText={setRelatedMemoId}
                />
              </View>
            )}
          </Animated.View>

          <View style={styles.spacer} />

          {/* TEXT */}
          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <View style={styles.rowReverseBetween}>
              <Text style={styles.sectionLabel}>النص</Text>
              <View style={styles.rowReverse}>
                <Text style={[styles.sectionLabel, { marginBottom: 0, marginLeft: 8 }]}>شعر (شطرين)</Text>
                <Switch 
                  value={isPoetry} 
                  onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsPoetry(v); }}
                  trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.12)' }}
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
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>الوسائط (اختياري)</Text>
            <View style={styles.mediaRow}>
              <TouchableOpacity style={styles.mediaCard}>
                {imageUrl ? (
                  <View style={styles.mediaPreview}>
                    <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} />
                    <TouchableOpacity style={styles.removeMediaOverlay} onPress={() => setImageUrl('')}>
                      <X color="#fff" size={24} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Camera color={colors.textMuted} size={28} />
                    <Text style={styles.mediaText}>إضافة صورة</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <View style={[styles.mediaCard, { overflow: 'hidden' }]}>
                {audioUrl ? (
                  <>
                    <TouchableOpacity onPress={isPlaying ? () => {} : playSound} style={{ alignItems: 'center' }}>
                      {isPlaying ? (
                        <AudioWaveform isActive={true} />
                      ) : (
                        <Play color={colors.accent} size={28} />
                      )}
                      <Text style={styles.mediaText}>{isPlaying ? 'جاري التشغيل...' : 'تشغيل الصوت'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }} onPress={() => setAudioUrl('')}>
                      <Trash color={colors.error} size={16} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={{ alignItems: 'center' }}>
                    {recording ? (
                      <AudioWaveform isActive={true} />
                    ) : (
                      <Mic color={colors.textMuted} size={28} />
                    )}
                    <Text style={[styles.mediaText, recording && { color: colors.error }]}>
                      {recording ? 'إيقاف التسجيل' : 'تسجيل'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>

        </ScrollView>

        <View style={styles.stickyBottom}>
          <Button 
            variant="primary"
            label={isEditing ? "حفظ التعديلات" : "ابدإ التكرار"}
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 100 },
  spacer: { height: 24 },
  sectionLabel: { fontSize: 13, color: colors.textSecondary, textAlign: 'right', marginBottom: 8 },
  chipScroll: { flexDirection: 'row-reverse', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)'
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 14 },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  darkCard: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14 },
  rowReverse: { flexDirection: 'row-reverse', alignItems: 'center' },
  rowReverseBetween: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', textAlign: 'right' },
  cardSubtext: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  poetryContainer: { gap: 12 },
  divider: { height: 1, backgroundColor: colors.border, width: '50%', alignSelf: 'center', marginVertical: 4 },
  mediaRow: { flexDirection: 'row-reverse', gap: 12 },
  mediaCard: {
    flex: 1, height: 100, backgroundColor: colors.surfaceHigh,
    borderRadius: 12, borderWidth: 0.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', gap: 8, overflow: 'hidden'
  },
  mediaText: { color: colors.textMuted, fontSize: 13 },
  mediaPreview: { width: '100%', height: '100%' },
  removeMediaOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
  },
  stickyBottom: {
    padding: 16, backgroundColor: colors.primary, borderTopWidth: 0.5, borderTopColor: colors.border,
  }
});

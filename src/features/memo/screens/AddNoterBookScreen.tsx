/**
 * AddNoterBookScreen — Create a new book/video source for Noter.
 *
 * Design rules (matches ReviewSessionScreen standard):
 * - <MText> always, no raw <Text>
 * - colors.* / typography.* / fonts.* / spacing.* / radius.*
 * - Reanimated / MotiView — no RN Animated API
 * - RTL: row, textAlign:'right'
 * - Haptics on every interactive press
 * - MahfodPatternBackground on every screen
 * - Latin-numeral date formatter (no Indian digits)
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import { X, Book, Video } from 'lucide-react-native';
import Input from '@/shared/ui/Input';
import { useNavigation } from '@react-navigation/native';
import * as noterService from '../services/noter.service';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AddNoterBookScreen() {
  const navigation = useNavigation<any>();

  const [type, setType] = useState<'book' | 'video'>('book');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', 'يرجى إدخال عنوان المصدر');
      return;
    }
    setLoading(true);
    try {
      const book = await noterService.addBook({
        title, author, subject, type,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('NoterDetailScreen', { bookId: book.id });
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MahfodPatternBackground />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ width: 36 }} />
          <MText weight="bold" style={styles.headerTitle}>إضافة مصدر جديد</MText>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TYPE TOGGLE */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={styles.segmentControl}>
              <TouchableOpacity
                style={[styles.segmentBtn, type === 'video' && styles.segmentBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setType('video');
                }}
                activeOpacity={0.85}
              >
                <Video
                  size={16}
                  color={type === 'video' ? colors.primary : colors.textMuted}
                  style={{ marginLeft: spacing.xs }}
                />
                <MText
                  weight={type === 'video' ? 'bold' : 'semi'}
                  style={[styles.segmentText, type === 'video' && styles.segmentTextActive]}
                >
                  فيديو (مرئي)
                </MText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, type === 'book' && styles.segmentBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setType('book');
                }}
                activeOpacity={0.85}
              >
                <Book
                  size={16}
                  color={type === 'book' ? colors.primary : colors.textMuted}
                  style={{ marginLeft: spacing.xs }}
                />
                <MText
                  weight={type === 'book' ? 'bold' : 'semi'}
                  style={[styles.segmentText, type === 'book' && styles.segmentTextActive]}
                >
                  كتاب
                </MText>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* TITLE */}
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Input
              label="عنوان الكتاب / المصدر *"
              placeholder="اكتب العنوان هنا..."
              value={title}
              onChangeText={setTitle}
            />
          </Animated.View>

          {/* AUTHOR */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Input
              label="المؤلف (اختياري)"
              placeholder="الاسم..."
              value={author}
              onChangeText={setAuthor}
            />
          </Animated.View>

          {/* SUBJECT */}
          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <Input
              label="الموضوع (اختياري)"
              placeholder="العقيدة، الفقه، السيرة..."
              value={subject}
              onChangeText={setSubject}
            />
          </Animated.View>
        </ScrollView>

        {/* ── Sticky bottom CTA ─────────────────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <MText weight="bold" style={styles.ctaBtnText}>إضافة وتدوين الفوائد</MText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Safe wrapper ─────────────────────────────────────────────────────────
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // ── Header ───────────────────────────────────────────────────────────────
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

  // ── Scroll ───────────────────────────────────────────────────────────────
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },

  // ── Segment control ──────────────────────────────────────────────────────
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.sm + 2,
    gap: spacing.xs,
  },
  segmentBtnActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    ...typography.label,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primary,
  },

  // ── Footer CTA ───────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
    elevation: 8,
  },
  ctaBtnText: {
    ...typography.h3,
    color: colors.primary,
  },
});

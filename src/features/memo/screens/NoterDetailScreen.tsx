/**
 * NoterDetailScreen — View & add notes for a book/video source.
 *
 * Rules (matches ReviewSessionScreen standard):
 * - <MText> always, no raw <Text>
 * - colors.* / typography.* / fonts.* / spacing.* / radius.*
 * - Reanimated — no RN Animated API
 * - RTL: row, textAlign:'right'
 * - Haptics on every interactive press
 * - MahfodPatternBackground on every screen
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import {
  MapPin, X, Trash2, Edit2, RotateCcw,
  ChevronDown, Bookmark, Search,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import * as noterService from '../services/noter.service';
import { NoterBook, NoterNote, NoteType } from '@/types';
import BottomSheet, {
  BottomSheetView, BottomSheetTextInput, BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Button from '@/shared/ui/Button';
import { isArabicText } from '@/shared/utils/textDirection';

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTE_COLORS: Record<NoteType, string> = {
  'فكرة':   colors.accent,
  'قلت':    colors.catMatn,
  'تلخيص':  colors.info,
  'أبيات':  colors.success,
  'تعقيب':  colors.error,
};

const NOTE_TYPES: NoteType[] = ['تعقيب', 'أبيات', 'قلت', 'تلخيص', 'فكرة'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NoterDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'NoterDetailScreen'>>();
  const navigation = useNavigation();
  const { bookId } = route.params;

  const [book, setBook] = useState<NoterBook | null>(null);
  const [notes, setNotes] = useState<NoterNote[]>([]);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [newNoteType, setNewNoteType] = useState<NoteType>('فكرة');
  const [newNoteText, setNewNoteText] = useState('');
  const [newPageRef, setNewPageRef] = useState('');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['10%', '55%'], []);

  // Floating icon animation for empty state
  const floatAnim = useSharedValue(0);
  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);
  const floatingIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const loadData = async () => {
    try {
      const books = await noterService.getBooks();
      const b = books.find(x => x.id === bookId);
      if (b) setBook(b);
      setNotes(await noterService.getNotes(bookId));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [bookId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      await noterService.addNote({
        book_id: bookId,
        text: newNoteText.trim(),
        note_type: newNoteType,
        page_ref: newPageRef.trim(),
        order_index: notes.length,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewNoteText('');
      setNewPageRef('');
      bottomSheetRef.current?.collapse();
      loadData();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', e.message);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('حذف الملاحظة', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        await noterService.deleteNote(noteId);
        loadData();
      }},
    ]);
  };

  const adjustFontSize = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontSizeScale(prev => Math.min(Math.max(prev + delta, 0.6), 1.6));
  };

  // ── Render note card ────────────────────────────────────────────────────────

  const renderNote = ({ item, index }: { item: NoterNote; index: number }) => {
    const noteColor = NOTE_COLORS[item.note_type] || colors.accent;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <View style={[styles.noteCard, { borderLeftColor: noteColor }]}>
          <View style={styles.noteTopRow}>
            <View style={styles.noteActions}>
              <TouchableOpacity
                onPress={() => handleDeleteNote(item.id)}
                hitSlop={8}
              >
                <Trash2 color={colors.textMuted} size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginLeft: spacing.sm + 4 }}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                hitSlop={8}
              >
                <Edit2 color={colors.textMuted} size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginLeft: spacing.sm + 4 }}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                hitSlop={8}
              >
                <RotateCcw color={colors.textMuted} size={16} />
              </TouchableOpacity>
            </View>
            <View style={styles.typeBadge}>
              <MText weight="semi" style={[styles.typeText, { color: noteColor }]}>
                {item.note_type}
              </MText>
            </View>
          </View>
          <MText
            weight="regular"
            style={[styles.noteText, { fontSize: 14 * fontSizeScale }]}
          >
            {item.text}
          </MText>
          {!!item.page_ref && (
            <MText weight="regular" style={styles.pageRef}>ص {item.page_ref}</MText>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <MahfodPatternBackground />

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <MapPin color={colors.primary} size={16} />
            <MText weight="bold" style={styles.mapBtnText}>الخريطة</MText>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <MText weight="bold" style={styles.headerTitle} numberOfLines={1}>
              {book?.title}
            </MText>
            {!!book?.author && (
              <MText weight="regular" style={styles.headerSubtitle} numberOfLines={1}>
                {book.author}
              </MText>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            hitSlop={10}
          >
            <X color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* ── Toolbar ── */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <MText weight="regular" style={styles.toolBtnText}>كوفي</MText>
          </TouchableOpacity>

          <View style={styles.fontControls}>
            <TouchableOpacity onPress={() => adjustFontSize(0.1)}>
              <MText weight="regular" style={styles.toolBtnText}>+أ</MText>
            </TouchableOpacity>
            <MText weight="regular" style={styles.fontScaleText}>
              {Math.round(fontSizeScale * 100)}%
            </MText>
            <TouchableOpacity onPress={() => adjustFontSize(-0.1)}>
              <MText weight="regular" style={styles.toolBtnText}>-أ</MText>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={14} color={colors.textMuted} />
            <TextInput
              placeholder="بحث..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign={isArabicText(searchQuery || 'بحث') ? 'right' : 'left'}
              style={[styles.searchInput, { textAlign: isArabicText(searchQuery || 'بحث') ? 'right' : 'left' }]}
            />
          </View>
        </View>

        {/* ── Notes list ── */}
        <FlatList
          data={notes.filter(n => n.text.includes(searchQuery))}
          keyExtractor={item => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Animated.View style={floatingIconStyle}>
                <Bookmark color={colors.accent} size={64} style={{ opacity: 0.8 }} />
              </Animated.View>
              <MText weight="bold" style={styles.emptyTitle}>لا توجد ملاحظات بعد</MText>
              <MText weight="regular" style={styles.emptySub}>
                اضغط على إضافة ملاحظة لتبدأ التدوين
              </MText>
            </View>
          }
        />
      </SafeAreaView>

      {/* ── Bottom sheet ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: colors.primaryLight }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        keyboardBehavior="interactive"
      >
        <BottomSheetView style={styles.panelExpanded}>
          <View style={styles.panelHeaderRow}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                bottomSheetRef.current?.collapse();
              }}
            >
              <ChevronDown color={colors.textMuted} size={24} />
            </TouchableOpacity>
            <View style={styles.panelHeaderRight}>
              <MText weight="regular" style={styles.chapterLabel}>الفصل: بدون فصل</MText>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <MText weight="semi" style={styles.smallBtnText}>+ فصل جديد</MText>
              </TouchableOpacity>
            </View>
          </View>

          <BottomSheetScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {NOTE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, newNoteType === type && styles.typeChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewNoteType(type);
                }}
              >
                <MText
                  weight={newNoteType === type ? 'bold' : 'regular'}
                  style={[
                    styles.typeChipText,
                    newNoteType === type && styles.typeChipTextActive,
                  ]}
                >
                  {type}
                </MText>
              </TouchableOpacity>
            ))}
          </BottomSheetScrollView>

          <View style={styles.inputRow}>
            <BottomSheetTextInput
              style={styles.pageInput}
              placeholder="ص"
              placeholderTextColor={colors.textMuted}
              value={newPageRef}
              onChangeText={setNewPageRef}
              keyboardType="numeric"
            />
            <BottomSheetTextInput
              placeholder="نص الملاحظة..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={newNoteText}
              onChangeText={setNewNoteText}
              textAlign={isArabicText(newNoteText || 'نص') ? 'right' : 'left'}
              style={[styles.mainInput, { textAlign: isArabicText(newNoteText || 'نص') ? 'right' : 'left' }]}
            />
          </View>

          <Button variant="primary" label="+ إضافة الملاحظة" onPress={handleAddNote} />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Root ─────────────────────────────────────────────────────────────────
  root: {
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
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  mapBtnText: {
    ...typography.caption,
    color: colors.primary,
  },
  headerCenter: {
    flex: 1,
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

  // ── Toolbar ──────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    gap: spacing.sm + 4,
  },
  toolBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolBtnText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontScaleText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 4,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'left',
  },

  // ── Notes list ───────────────────────────────────────────────────────────
  listContent: {
    padding: spacing.md,
    gap: spacing.sm + 4,
    paddingBottom: 150,
  },

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm + 4,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptySub: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },

  // ── Note card ────────────────────────────────────────────────────────────
  noteCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm + 2,
    borderLeftWidth: 3,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm - 4,
    backgroundColor: colors.surfaceHigh,
  },
  typeText: {
    ...typography.caption,
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    lineHeight: 24,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  pageRef: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'left',
    marginTop: spacing.sm,
  },

  // ── Bottom sheet panel ───────────────────────────────────────────────────
  panelExpanded: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    flex: 1,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  smallBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm - 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallBtnText: {
    ...typography.caption,
    color: colors.accent,
  },

  // ── Type chips ───────────────────────────────────────────────────────────
  chipsScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  typeChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
  },

  // ── Input row ────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    alignItems: 'flex-start',
  },
  pageInput: {
    width: 60,
    height: 44,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainInput: {
    flex: 1,
    minHeight: 80,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

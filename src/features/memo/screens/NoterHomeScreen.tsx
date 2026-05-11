/**
 * NoterHomeScreen — Main listing of all noter books/sources.
 *
 * Rules (matches ReviewSessionScreen standard):
 * - <MText> always, no raw <Text>
 * - colors.* / typography.* / fonts.* / spacing.* / radius.*
 * - RTL: row, textAlign:'right'
 * - Haptics on every interactive press
 * - MahfodPatternBackground on every screen
 * - Latin-numeral date formatter (no Indian digits)
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import { Library, Plus, ChevronLeft, Book, Video, Bookmark } from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import * as noterService from '../services/noter.service';
import { NoterBook } from '@/types';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
function toLatinDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

export default function NoterHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [books, setBooks] = useState<NoterBook[]>([]);

  const floatAnim = useSharedValue(0);
  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);

  const loadBooks = async () => {
    try { setBooks(await noterService.getBooks()); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { if (isFocused) loadBooks(); }, [isFocused]);

  const handleLongPress = (book: NoterBook) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('خيارات المصدر', book.title, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'فتح', onPress: () => navigation.navigate('NoterDetailScreen', { bookId: book.id }) },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try { await noterService.deleteBook(book.id); loadBooks(); }
        catch { Alert.alert('خطأ', 'لم يتم الحذف'); }
      }},
    ]);
  };

  const renderBook = ({ item, index }: { item: NoterBook; index: number }) => {
    const isVideo = item.type === 'video';
    const accent = isVideo ? colors.catMatn : colors.accent;
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <TouchableOpacity
          style={styles.bookCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('NoterDetailScreen', { bookId: item.id });
          }}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.8}
        >
          <View style={[styles.stripe, { backgroundColor: accent }]} />
          <View style={styles.cardTopRow}>
            <ChevronLeft color={colors.textMuted} size={20} />
            <View style={styles.cardCenter}>
              <MText weight="semi" style={styles.bookTitle}>{item.title}</MText>
              {!!item.author && <MText weight="regular" style={styles.bookAuthor}>{item.author}</MText>}
            </View>
            <View style={[styles.iconBox, { borderColor: isVideo ? colors.catMatn : colors.accentBorder }]}>
              {isVideo ? <Video color={colors.catMatn} size={20} /> : <Book color={colors.accent} size={20} />}
            </View>
          </View>
          <View style={styles.cardBottomRow}>
            <MText weight="regular" style={styles.dateText}>{toLatinDate(item.created_at)}</MText>
            <View style={styles.subjectBadge}>
              <MText weight="semi" style={styles.subjectText}>{item.subject || 'عام'}</MText>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const bookCount = books.filter(b => b.type === 'book').length;
  const videoCount = books.filter(b => b.type === 'video').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MahfodPatternBackground />

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <Library color={colors.accent} size={24} />
        <View style={{ alignItems: 'flex-end' }}>
          <MText weight="extra" style={styles.headerTitle}>المطالعات</MText>
          <MText weight="regular" style={styles.headerSubtitle}>الكتب والدروس المرئية</MText>
        </View>
      </Animated.View>

      {/* ── Stats card ── */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statsCard}>
        <View style={styles.statCol}>
          <MText weight="bold" style={styles.statVal}>{videoCount}</MText>
          <MText weight="regular" style={styles.statLabel}>مرئيات</MText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <MText weight="bold" style={styles.statVal}>{books.length}</MText>
          <MText weight="regular" style={styles.statLabel}>المجموع</MText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <MText weight="bold" style={styles.statVal}>{bookCount}</MText>
          <MText weight="regular" style={styles.statLabel}>كتب</MText>
        </View>
      </Animated.View>

      {/* ── List ── */}
      <FlatList
        data={books}
        keyExtractor={item => item.id}
        renderItem={renderBook}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.springify()} style={styles.emptyState}>
            <Animated.View style={floatingStyle}>
              <Bookmark color={colors.accent} size={72} style={{ opacity: 0.7 }} />
            </Animated.View>
            <MText weight="bold" style={styles.emptyTitle}>لا توجد مصادر بعد</MText>
            <MText weight="regular" style={styles.emptySubtitle}>
              أضف كتاباً أو درساً مرئياً لتبدأ تدوين ملاحظاتك
            </MText>
          </Animated.View>
        }
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fabWrapper}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('AddNoterBookScreen');
        }}
        activeOpacity={0.85}
      >
        <View style={styles.fabGlow} />
        <View style={styles.fab}>
          <Plus color={colors.primary} size={28} />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Safe wrapper ──
  safe: { flex: 1, backgroundColor: colors.primary },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h1, color: colors.textPrimary, textAlign: 'left' },
  headerSubtitle: { ...typography.caption, color: colors.textMuted, textAlign: 'left', marginTop: 2 },

  // ── Stats card ──
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { ...typography.h2, color: colors.accent },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },

  // ── List ──
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 120 },

  // ── Book card ──
  bookCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardCenter: { flex: 1, marginRight: spacing.sm + 4 },
  bookTitle: { ...typography.bodySmall, fontFamily: fonts.semi, color: colors.textPrimary, textAlign: 'left' },
  bookAuthor: { ...typography.caption, color: colors.textMuted, textAlign: 'left', marginTop: 2 },
  iconBox: {
    width: 40, height: 40, borderRadius: radius.sm + 2,
    backgroundColor: colors.surfaceHigh, justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  cardBottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm + 4, paddingTop: spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  dateText: { ...typography.caption, color: colors.textMuted },
  subjectBadge: {
    backgroundColor: colors.accentSoft, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.accentBorder,
  },
  subjectText: { ...typography.caption, color: colors.accent },

  // ── Empty state ──
  emptyState: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm + 4 },
  emptyTitle: { ...typography.h3, color: colors.textSecondary, textAlign: 'center' },
  emptySubtitle: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', maxWidth: 260, lineHeight: 22 },

  // ── FAB ──
  fabWrapper: { position: 'absolute', bottom: spacing.xl, left: spacing.lg },
  fabGlow: {
    position: 'absolute', width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.accent, opacity: 0.25, transform: [{ scale: 1.5 }],
  },
  fab: {
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
    ...Shadows.glow, elevation: 8,
  },
});

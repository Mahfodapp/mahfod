/**
 * MemoLibraryScreen — "مكتبتي"
 *
 * Shows all the user's memos as books on wooden shelves.
 * - Lazily loads 20 memos at a time from the DB (infinite scroll)
 * - Client-side search by title / text / label (resets to page 0)
 * - Stage filter chips (ALL / LEARNING / REVISION / MASTERED)
 * - Shelf mode (4-per-row on wooden planks) + List mode toggle
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useMemoStore } from '../store/memo.store';
import { useAlertStore } from '@/shared/store/alert.store';
import { LibraryHeader } from '../components/LibraryHeader';
import { LibraryGrid } from '../components/LibraryGrid';
import { LibraryShelfRow } from '../components/LibraryShelfRow';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, fonts, typography, radius } from '@/shared/theme';
import { Search, X, Trash2, Eye, Pencil } from 'lucide-react-native';
import { Memo } from '@/types';
import { isArabicText } from '@/shared/utils/textDirection';

type FilterKey = 'ALL' | 'LEARNING' | 'REVISION' | 'MASTERED';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',       label: 'الكل' },
  { key: 'LEARNING',  label: 'يُحفظ' },
  { key: 'REVISION',  label: 'مراجعة' },
  { key: 'MASTERED',  label: 'محكم' },
];

const STAGE_COLORS: Record<FilterKey, string> = {
  ALL:       colors.accent,
  LEARNING:  colors.stageLearning,
  REVISION:  colors.stageReview,
  MASTERED:  colors.stageMastered,
};

export default function MemoLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    pagedMemos,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchMemosPage,
    loadMore,
    resetPaged,
    deleteMemo,
  } = useMemoStore();

  const [search, setSearch]             = useState('');
  const [viewMode, setViewMode]         = useState<'shelf' | 'list'>('shelf');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');

  // ── Popup (shared between shelf & list mode) ──────────────────────────────
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const slideAnim = useSharedValue(300);

  const openPopup = useCallback((memo: Memo) => {
    setSelectedMemo(memo);
    slideAnim.value = 300;
    slideAnim.value = withSpring(0, { damping: 11, stiffness: 65 });
  }, [slideAnim]);

  const closePopup = useCallback((cb?: () => void) => {
    slideAnim.value = withTiming(300, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(setSelectedMemo)(null);
        if (cb) runOnJS(cb)();
      }
    });
  }, [slideAnim]);

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  // ── Debounce search ───────────────────────────────────────────────────────
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilters = useMemo(() => ({
    stage:  activeFilter === 'ALL' ? undefined : activeFilter,
    search: search.trim() || undefined,
  }), [activeFilter, search]);

  // ── Load / reload when filter or search changes ──────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const delay = search ? 300 : 0;
    searchTimer.current = setTimeout(() => {
      fetchMemosPage(activeFilters);
    }, delay);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, search]);

  // ── Clean up on unmount ──────────────────────────────────────────────────
  useEffect(() => () => resetPaged(), [resetPaged]);

  // ── Stage counts (ALL from totalCount; rest computed from loaded pages) ──
  const counts = useMemo(() => {
    const c = pagedMemos.reduce(
      (acc, m) => {
        if (m.stage === 'LEARNING')  acc.LEARNING++;
        else if (m.stage === 'REVISION') acc.REVISION++;
        else if (m.stage === 'MASTERED') acc.MASTERED++;
        return acc;
      },
      { LEARNING: 0, REVISION: 0, MASTERED: 0 },
    );
    return { ALL: totalCount, ...c };
  }, [pagedMemos, totalCount]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const toggleView = useCallback(() => setViewMode(v => v === 'shelf' ? 'list' : 'shelf'), []);
  const clearSearch = useCallback(() => setSearch(''), []);

  const showAlert = useAlertStore(s => s.showAlert);

  const handleDeleteMemo = useCallback((memo: Memo) => {
    showAlert(
      'حذف المحفوظ',
      `هل أنت متأكد أنك تريد حذف «${memo.title}»؟ لا يمكن التراجع عن هذا الإجراء.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => deleteMemo(memo.id) },
      ],
    );
  }, [deleteMemo, showAlert]);

  const handleMemoPress = useCallback((memo: Memo) => {
    if (memo.stage === 'LEARNING') {
      navigation.navigate('LearningSessionScreen', { memoId: memo.id });
    } else {
      navigation.navigate('ReviewSessionScreen', { memoId: memo.id });
    }
  }, [navigation]);

  const handleMemoEdit = useCallback((memo: Memo) => {
    navigation.navigate('AddMemoScreen', { memoId: memo.id });
  }, [navigation]);

  // ── Infinite scroll ──────────────────────────────────────────────────────
  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && hasMore) loadMore(activeFilters);
  }, [isLoadingMore, hasMore, loadMore, activeFilters]);

  // ── Shelf rows (groups of 4) ─────────────────────────────────────────────
  const shelfRows = useMemo(() => {
    const result: Memo[][] = [];
    for (let i = 0; i < pagedMemos.length; i += 4) {
      result.push(pagedMemos.slice(i, i + 4));
    }
    return result;
  }, [pagedMemos]);

  // ── Footer spinner / end-of-list ─────────────────────────────────────────
  const ListFooter = useMemo(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      );
    }
    if (!hasMore && pagedMemos.length > 0) {
      return (
        <View style={styles.footer}>
          <MText weight="regular" style={styles.footerText}>نهاية المكتبة ✦</MText>
        </View>
      );
    }
    return null;
  }, [isLoadingMore, hasMore, pagedMemos.length]);

  // ── Shared list header (search + chips + hint) ────────────────────────────
  const ListHeader = useMemo(() => (
    <>
      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.accent} strokeWidth={1.8} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في مكتبتك..."
            placeholderTextColor={colors.accent}
            value={search}
            onChangeText={setSearch}
            textAlign={isArabicText(search || 'ابحث') ? 'right' : 'left'}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <X size={16} color={colors.accent} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filtersContainer}>
        {FILTERS.map(f => {
          const isActive = activeFilter === f.key;
          const stageColor = STAGE_COLORS[f.key];
          return (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.chip,
                isActive && { backgroundColor: stageColor, borderColor: stageColor },
              ]}
            >
              <MText
                weight="semi"
                style={[styles.chipLabel, { color: isActive ? colors.primary : colors.textSecondary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {f.label}
              </MText>
              <View
                style={[
                  styles.chipCount,
                  { backgroundColor: isActive ? 'rgba(0,0,0,0.2)' : colors.surfaceHigh },
                ]}
              >
                <MText
                  weight="bold"
                  style={[styles.chipCountText, { color: isActive ? colors.primary : stageColor }]}
                >
                  {counts[f.key]}
                </MText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <MText weight="regular" style={styles.hint}>
        رف الكتب — اضغط مطولاً لخيارات
      </MText>
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [search, activeFilter, counts, clearSearch]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MahfodPatternBackground />

      {/* Fixed header */}
      <LibraryHeader
        total={totalCount}
        viewMode={viewMode}
        onToggleView={toggleView}
        onBack={handleBack}
      />

      {/* First-load spinner */}
      {isLoading && pagedMemos.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} size="large" />
          <MText weight="regular" style={styles.loadingText}>
            جارٍ تحميل مكتبتك…
          </MText>
        </View>
      ) : viewMode === 'shelf' ? (
        // ── SHELF MODE — FlatList of shelf rows (lazy) ──
        <FlatList
          data={shelfRows}
          keyExtractor={(_, i) => `row-${i}`}
          renderItem={({ item, index }) => (
            <LibraryShelfRow
              memos={item}
              onPress={handleMemoPress}
              onLongPress={openPopup}
              rowIndex={index}
            />
          )}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        />
      ) : (
        // ── LIST MODE — LibraryGrid handles its own FlatList (lazy) ──
        <LibraryGrid
          memos={pagedMemos}
          viewMode="list"
          onMemoPress={handleMemoPress}
          onMemoEdit={handleMemoEdit}
          onMemoDelete={handleDeleteMemo}
          onLongPress={openPopup}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* ── Action popup (shared across shelf & list) ── */}
      <Modal
        visible={!!selectedMemo}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => closePopup()}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => closePopup()}
        >
          <Animated.View style={[styles.sheet, animatedSheetStyle]}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <MText weight="bold" style={styles.sheetTitle} numberOfLines={1}>
                {selectedMemo?.title}
              </MText>
              <TouchableOpacity
                onPress={() => closePopup()}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <MText weight="regular" style={styles.sheetSubtitle}>
              ماذا تريد أن تفعل بهذا المحفوظ؟
            </MText>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionDelete]}
                onPress={() => closePopup(() => handleDeleteMemo(selectedMemo!))}
                activeOpacity={0.75}
              >
                <Trash2 size={22} color={colors.error} />
                <MText weight="semi" style={[styles.actionLabel, { color: colors.error }]}>حذف</MText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionOpen]}
                onPress={() => closePopup(() => handleMemoPress(selectedMemo!))}
                activeOpacity={0.75}
              >
                <Eye size={22} color={colors.primary} />
                <MText weight="semi" style={[styles.actionLabel, { color: colors.primary }]}>فتح</MText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionEdit]}
                onPress={() => closePopup(() => handleMemoEdit(selectedMemo!))}
                activeOpacity={0.75}
              >
                <Pencil size={22} color={colors.accent} />
                <MText weight="semi" style={[styles.actionLabel, { color: colors.accent }]}>تعديل</MText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.sm,
    height: 48,
    gap: spacing.xs,
  },
  searchIcon: {
    marginLeft: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.accent,
    fontFamily: fonts.regular,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  filtersContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  chipLabel: { fontSize: 12 },
  chipCount: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chipCountText: { fontSize: 10 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'left',
    marginBottom: spacing.sm,
    marginRight: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  // ── Popup ───────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayHeavy,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.borderStrong,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.surfaceBright,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'left',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'left',
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 14 },
  actionDelete: {
    backgroundColor: colors.errorSoft,
    borderColor: 'rgba(255,115,81,0.25)',
  },
  actionOpen: {
    backgroundColor: colors.accent,
    borderColor: colors.accentBorder,
  },
  actionEdit: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.borderStrong,
  },
});

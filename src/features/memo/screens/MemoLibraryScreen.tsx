/**
 * MemoLibraryScreen — "مكتبتي"
 *
 * Shows all the user's memos as books on wooden shelves.
 * - Fetches real data from useMemoStore on mount
 * - Client-side search by title
 * - Stage filter chips (ALL / LEARNING / REVISION / MASTERED)
 * - Shelf mode (4-per-row on wooden planks) + List mode toggle
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useMemoStore } from '../store/memo.store';
import { useAlertStore } from '@/shared/store/alert.store';
import { LibraryHeader } from '../components/LibraryHeader';
import { LibraryGrid } from '../components/LibraryGrid';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, fonts, typography, radius } from '@/shared/theme';
import { Search, X } from 'lucide-react-native';
import { Memo } from '@/types';
import { isArabicText } from '@/shared/utils/textDirection';

type FilterKey = 'ALL' | 'LEARNING' | 'REVISION' | 'MASTERED';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',       label: 'الكل' },
  { key: 'LEARNING',  label: 'يُحفظ' },
  { key: 'REVISION', label: 'مراجعة' },
  { key: 'MASTERED',  label: 'محكم' },
];

const STAGE_COLORS: Record<FilterKey, string> = {
  ALL:       colors.accent,
  LEARNING:  colors.stageLearning,
  REVISION: colors.stageReview,
  MASTERED:  colors.stageMastered,
};

export default function MemoLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { memos, isLoading, fetchMemos, deleteMemo } = useMemoStore();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'shelf' | 'list'>('shelf');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');

  // ── Load data once on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  // ── Client-side search filter ────────────────────────────────────────────
  const filteredMemosBySearch: Memo[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return memos;
    return memos.filter(
      m =>
        m.title.toLowerCase().includes(q) ||
        m.text.toLowerCase().includes(q)  ||
        (m.label && m.label.toLowerCase().includes(q)),
    );
  }, [memos, search]);

  const counts = useMemo(() => ({
    ALL:       filteredMemosBySearch.length,
    LEARNING:  filteredMemosBySearch.filter(m => m.stage === 'LEARNING').length,
    REVISION: filteredMemosBySearch.filter(m => m.stage === 'REVISION').length,
    MASTERED:  filteredMemosBySearch.filter(m => m.stage === 'MASTERED').length,
  }), [filteredMemosBySearch]);

  const finalMemos = useMemo(() => 
    activeFilter === 'ALL'
      ? filteredMemosBySearch
      : filteredMemosBySearch.filter(m => m.stage === activeFilter)
  , [filteredMemosBySearch, activeFilter]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const toggleView = useCallback(() => {
    setViewMode(v => (v === 'shelf' ? 'list' : 'shelf'));
  }, []);

  const clearSearch = useCallback(() => setSearch(''), []);

  const showAlert = useAlertStore(s => s.showAlert);

  const handleDeleteMemo = useCallback((memo: Memo) => {
    showAlert(
      'حذف المحفوظ',
      `هل أنت متأكد أنك تريد حذف «${memo.title}»؟ لا يمكن التراجع عن هذا الإجراء.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => deleteMemo(memo.id) },
      ]
    );
  }, [deleteMemo, showAlert]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Islamic pattern background */}
      <MahfodPatternBackground />

      {/* ── Fixed header (doesn't scroll) ── */}
      <LibraryHeader
        total={memos.length}
        viewMode={viewMode}
        onToggleView={toggleView}
        onBack={handleBack}
      />

      {/* ── Search bar ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search
            size={18}
            color={colors.accent}
            strokeWidth={1.8}
            style={styles.searchIcon}
          />
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

      {/* ── Stage filter chips ── */}
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
                isActive && {
                  backgroundColor: stageColor,
                  borderColor: stageColor,
                },
              ]}
            >
              <MText
                weight="semi"
                style={[
                  styles.chipLabel,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {f.label}
              </MText>
              <View
                style={[
                  styles.chipCount,
                  {
                    backgroundColor: isActive
                      ? 'rgba(0,0,0,0.2)'
                      : colors.surfaceHigh,
                  },
                ]}
              >
                <MText
                  weight="bold"
                  style={[
                    styles.chipCountText,
                    { color: isActive ? colors.primary : stageColor },
                  ]}
                >
                  {counts[f.key]}
                </MText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── Scrollable content ── */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} size="large" />
          <MText weight="regular" style={styles.loadingText}>
            جارٍ تحميل مكتبتك…
          </MText>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          <LibraryGrid
            memos={finalMemos}
            viewMode={viewMode}
            onMemoPress={(memo) => {
              if (memo.stage === 'LEARNING') {
                navigation.navigate('LearningSessionScreen', { memoId: memo.id });
              } else {
                // REVISION or MASTERED → go straight to review session
                navigation.navigate('ReviewSessionScreen', { memoId: memo.id });
              }
            }}
            onMemoEdit={(memo) => {
              navigation.navigate('AddMemoScreen', { memoId: memo.id });
            }}
            onMemoDelete={handleDeleteMemo}
          />
        </ScrollView>
      )}
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
  chipLabel: {
    fontSize: 12,
  },
  chipCount: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chipCountText: {
    fontSize: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
});

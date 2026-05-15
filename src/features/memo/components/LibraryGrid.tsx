/**
 * LibraryGrid — list-mode renderer for the memo library.
 * Popup / long-press actions are delegated to the parent screen via onLongPress.
 * Shelf mode is handled directly in MemoLibraryScreen using LibraryShelfRow.
 */
import React from 'react';
import {
  View,
  FlatList,
  FlatListProps,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius } from '@/shared/theme';
import { Memo } from '@/types';
import { StageBadge } from '@/shared/ui/StageBadge';
import { BookOpen, Trash2, Share2 } from 'lucide-react-native';

interface Props {
  memos: Memo[];
  viewMode: 'shelf' | 'list';
  onMemoPress?: (memo: Memo) => void;
  onMemoEdit?: (memo: Memo) => void;
  onMemoDelete?: (memo: Memo) => void;
  /** Called when a row is long-pressed — parent owns the popup */
  onLongPress?: (memo: Memo) => void;
  // FlatList passthrough for infinite scroll
  ListHeaderComponent?: FlatListProps<Memo>['ListHeaderComponent'];
  ListFooterComponent?: FlatListProps<Memo>['ListFooterComponent'];
  onEndReached?: FlatListProps<Memo>['onEndReached'];
  onEndReachedThreshold?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LibraryGrid({
  memos,
  onMemoPress,
  onMemoEdit,
  onMemoDelete,
  onLongPress,
  ListHeaderComponent,
  ListFooterComponent,
  onEndReached,
  onEndReachedThreshold = 0.3,
}: Props) {

  if (memos.length === 0) {
    return (
      <FlatList
        data={[]}
        keyExtractor={() => 'empty'}
        renderItem={() => null}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={<EmptyLibrary />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      />
    );
  }

  return (
    <FlatList
      data={memos}
      keyExtractor={m => m.id}
      renderItem={({ item }) => (
        <ListRow
          memo={item}
          onPress={() => onMemoPress?.(item)}
          onLongPress={() => onLongPress?.(item)}
          onDelete={() => onMemoDelete?.(item)}
        />
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
    />
  );
}

// ─── List row ────────────────────────────────────────────────────────────────

function ListRow({
  memo,
  onPress,
  onLongPress,
  onDelete,
}: {
  memo: Memo;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}) {
  const dateStr = memo.next_review_at
    ? new Date(memo.next_review_at).toLocaleDateString('ar-MA')
    : 'جديد';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [styles.listRow, pressed && styles.listRowPressed]}
    >
      <View style={styles.listRowMain}>
        <MText weight="semi" style={styles.listTitle} numberOfLines={1}>
          {memo.title}
        </MText>
        <View style={styles.listRowMeta}>
          <StageBadge stage={memo.stage} />
          {memo.label ? (
            <View style={styles.metaChip}>
              <MText weight="regular" style={styles.metaChipText}>{memo.label}</MText>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <MText weight="regular" style={styles.metaChipText}>{dateStr}</MText>
          </View>
        </View>
      </View>

      <View style={styles.listRowActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => {}}>
          <Share2 size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
          <Trash2 size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyLibrary() {
  return (
    <View style={styles.empty}>
      <BookOpen size={48} color={colors.textMuted} strokeWidth={1.2} />
      <MText weight="semi" style={styles.emptyTitle}>
        مكتبتك فارغة
      </MText>
      <MText weight="regular" style={styles.emptySubtitle}>
        أضف محفوظاتك لتظهر هنا على الرف
      </MText>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    gap: spacing.sm,
    paddingBottom: 20,
    paddingHorizontal: spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  listRowPressed: {
    opacity: 0.75,
  },
  listRowMain: {
    flex: 1,
    gap: 8,
    alignItems: 'flex-start',
  },
  listTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  listRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  metaChip: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  metaChipText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  listRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  iconBtn: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

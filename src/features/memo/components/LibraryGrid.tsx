/**
 * LibraryGrid — renders all filtered memos as books on wooden shelves.
 * Supports shelf mode (default) and list mode toggle.
 * Shows empty state when no memos match.
 */
import React, { useMemo } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius } from '@/shared/theme';
import { Memo } from '@/types';
import { LibraryShelfRow } from './LibraryShelfRow';
import { StageBadge } from '@/shared/ui/StageBadge';
import { BookOpen, Trash2, Eye, Pencil, X, Share2 } from 'lucide-react-native';

interface Props {
  memos: Memo[];
  viewMode: 'shelf' | 'list';
  onMemoPress?: (memo: Memo) => void;
  onMemoEdit?: (memo: Memo) => void;
  onMemoDelete?: (memo: Memo) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Component ───────────────────────────────────────────────────────────────

export function LibraryGrid({ memos, viewMode, onMemoPress, onMemoEdit, onMemoDelete }: Props) {
  const [selectedMemo, setSelectedMemo] = React.useState<Memo | null>(null);
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  // Split into rows of 4 for shelf rendering
  const rows = useMemo(() => {
    const result: Memo[][] = [];
    for (let i = 0; i < memos.length; i += 4) {
      result.push(memos.slice(i, i + 4));
    }
    return result;
  }, [memos]);

  // ── Popup helpers ────────────────────────────────────────────────────────

  const openPopup = (memo: Memo) => {
    setSelectedMemo(memo);
    slideAnim.setValue(300);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closePopup = (cb?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSelectedMemo(null);
      cb?.();
    });
  };

  const handleLongPress = (memo: Memo) => openPopup(memo);

  return (
    <View style={styles.container}>

      {/* ── Hint ── */}
      <MText weight="regular" style={styles.hint}>
        رف الكتب — اضغط مطولاً لخيارات
      </MText>

      {/* ── Content ── */}
      {memos.length === 0 ? (
        <EmptyLibrary />
      ) : viewMode === 'shelf' ? (
        // ── SHELF MODE ──
        <FlatList
          data={rows}
          keyExtractor={(_, i) => `row-${i}`}
          renderItem={({ item, index }) => (
            <LibraryShelfRow
              memos={item}
              onPress={(memo) => onMemoPress?.(memo)}
              onLongPress={handleLongPress}
              rowIndex={index}
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.shelvesContent}
        />
      ) : (
        // ── LIST MODE ──
        <FlatList
          data={memos}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <ListRow
              memo={item}
              onPress={() => onMemoPress?.(item)}
              onLongPress={() => handleLongPress(item)}
              onDelete={() => onMemoDelete?.(item)}
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ── Mahfod Custom Action Popup ── */}
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
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* drag handle */}
            <View style={styles.handle} />

            {/* header: title + close button */}
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

            {/* ── Action buttons ── */}
            <View style={styles.actionsRow}>

              {/* DELETE */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionDelete]}
                onPress={() => closePopup(() => onMemoDelete?.(selectedMemo!))}
                activeOpacity={0.75}
              >
                <Trash2 size={22} color={colors.error} />
                <MText weight="semi" style={[styles.actionLabel, { color: colors.error }]}>
                  حذف
                </MText>
              </TouchableOpacity>

              {/* OPEN */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionOpen]}
                onPress={() => closePopup(() => onMemoPress?.(selectedMemo!))}
                activeOpacity={0.75}
              >
                <Eye size={22} color={colors.primary} />
                <MText weight="semi" style={[styles.actionLabel, { color: colors.primary }]}>
                  فتح
                </MText>
              </TouchableOpacity>

              {/* EDIT */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionEdit]}
                onPress={() => closePopup(() => onMemoEdit?.(selectedMemo!))}
                activeOpacity={0.75}
              >
                <Pencil size={22} color={colors.accent} />
                <MText weight="semi" style={[styles.actionLabel, { color: colors.accent }]}>
                  تعديل
                </MText>
              </TouchableOpacity>

            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

    </View>
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
  container: {
    flex: 1,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'left',
    marginBottom: spacing.sm,
    marginRight: spacing.xs,
  },
  shelvesContent: {
    paddingTop: spacing.md,
    paddingBottom: 20,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: 20,
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

  // ── Custom action popup ──────────────────────────────────────────────────
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
  actionLabel: {
    fontSize: 14,
  },
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

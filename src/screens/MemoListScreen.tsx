import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMemoStore, Memo, MemoLabel } from '../store/useMemoStore';
import { colors } from '../theme/colors';
import { LabelBadge } from '../components/LabelBadge';
import { Trash2, BookOpen } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'MemoList'>;

const LABEL_FILTERS: (MemoLabel | 'الكل')[] = ['الكل', 'متن', 'شعر', 'حديث', 'فقه', 'عقيدة', 'أخرى'];

const STAGE_LABELS: Record<string, string> = {
    LEARNING: 'في الحفظ',
    REVIEWING: 'مراجعة',
    MASTERED: 'محكم ✓',
};

const STAGE_COLORS: Record<string, string> = {
    LEARNING: colors.info,
    REVIEWING: colors.warning,
    MASTERED: colors.success,
};

export default function MemoListScreen({ navigation }: Props) {
    const memos = useMemoStore(s => s.memos);
    const deleteMemo = useMemoStore(s => s.deleteMemo);
    const [activeFilter, setActiveFilter] = useState<MemoLabel | 'الكل'>('الكل');

    const filtered = activeFilter === 'الكل'
        ? memos
        : memos.filter(m => m.label === activeFilter);

    const handleDelete = (m: Memo) => {
        Alert.alert('حذف المحفوظ', `هل تريد حذف "${m.title}"؟`, [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'حذف', style: 'destructive', onPress: () => deleteMemo(m.id) },
        ]);
    };

    const handleLearn = (m: Memo) => {
        navigation.navigate('Learn', { memoId: m.id });
    };

    return (
        <View style={styles.container}>
            {/* Filter row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
                {LABEL_FILTERS.map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                        onPress={() => setActiveFilter(f)}
                    >
                        <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* List */}
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {filtered.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📖</Text>
                        <Text style={styles.emptyText}>لا توجد محفوظات في هذا التصنيف</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMemo')}>
                            <Text style={styles.addBtnText}>أضف محفوظاً جديداً</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {filtered.map(m => (
                    <View key={m.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <LabelBadge label={m.label} small />
                            <View style={[styles.stagePill, { backgroundColor: STAGE_COLORS[m.stage] + '22', borderColor: STAGE_COLORS[m.stage] + '66' }]}>
                                <Text style={[styles.stageText, { color: STAGE_COLORS[m.stage] }]}>{STAGE_LABELS[m.stage]}</Text>
                            </View>
                        </View>
                        <Text style={styles.cardTitle}>{m.title}</Text>
                        <Text style={styles.cardPreview} numberOfLines={2}>{m.text}</Text>

                        {m.stage === 'REVIEWING' && (
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${(m.reviewCount / 30) * 100}%` }]} />
                            </View>
                        )}

                        <View style={styles.cardActions}>
                            {m.stage === 'LEARNING' && (
                                <TouchableOpacity style={styles.learnBtn} onPress={() => handleLearn(m)}>
                                    <BookOpen size={16} color={colors.accent} />
                                    <Text style={styles.learnBtnText}>ابدأ الحفظ</Text>
                                </TouchableOpacity>
                            )}
                            <Text style={styles.cardDate}>
                                {m.stage === 'REVIEWING' ? `مراجعة ${m.reviewCount}/30` : ''}
                            </Text>
                            <TouchableOpacity onPress={() => handleDelete(m)} style={styles.deleteBtn}>
                                <Trash2 size={16} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMemo')}>
                <Text style={styles.fabText}>+ إضافة</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    filterBar: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.border },
    filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 20, backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border,
    },
    filterChipActive: { backgroundColor: colors.accent + '22', borderColor: colors.accent },
    filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: colors.accent },
    list: { flex: 1 },
    listContent: { padding: 16, gap: 12, paddingBottom: 80 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 50, marginBottom: 12 },
    emptyText: { color: colors.textSecondary, fontSize: 16, marginBottom: 20 },
    addBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
    addBtnText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    stagePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
    stageText: { fontSize: 11, fontWeight: '700' },
    cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardPreview: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
    progressBar: { height: 4, backgroundColor: colors.primaryLight, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
    progressFill: { height: 4, backgroundColor: colors.warning, borderRadius: 2 },
    cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
    learnBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: colors.accent + '22', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 5,
        borderWidth: 1, borderColor: colors.accent + '55',
    },
    learnBtnText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
    cardDate: { flex: 1, color: colors.textMuted, fontSize: 12 },
    deleteBtn: { padding: 6 },
    fab: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: colors.accent,
        borderRadius: 20,
        paddingHorizontal: 28,
        paddingVertical: 12,
        shadowColor: colors.accent,
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    fabText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
});

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMemoStore, Memo } from '../store/useMemoStore';
import { colors } from '../theme/colors';
import { LabelBadge } from '../components/LabelBadge';
import { CheckCircle, SkipForward } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ navigation }: Props) {
    const getTodayReviewMemos = useMemoStore(s => s.getTodayReviewMemos);
    const completeReview = useMemoStore(s => s.completeReview);
    const settings = useMemoStore(s => s.settings);

    const [queue] = useState<Memo[]>(() => getTodayReviewMemos());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [count, setCount] = useState(0);
    const maxCount = settings.reviewRepetitions;

    if (queue.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🌟</Text>
                <Text style={styles.emptyTitle}>أحسنت!</Text>
                <Text style={styles.emptyText}>أتممت مراجعة اليوم. تفقد غداً محفوظاتك الجديدة.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>العودة للرئيسية</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const current = queue[currentIndex];
    const isLastMemo = currentIndex >= queue.length - 1;
    const progress = count / maxCount;

    const handleCount = () => {
        if (count < maxCount) setCount(c => c + 1);
    };

    const handleDone = () => {
        completeReview(current.id);
        if (isLastMemo) {
            navigation.goBack();
        } else {
            setCurrentIndex(i => i + 1);
            setCount(0);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header progress */}
            <View style={styles.headerRow}>
                <Text style={styles.progressText}>{currentIndex + 1} / {queue.length}</Text>
                <LabelBadge label={current.label} small />
            </View>

            <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>

            <Text style={styles.memoTitle}>{current.title}</Text>
            <Text style={styles.reviewDay}>مراجعة اليوم {current.reviewCount + 1} / 30</Text>

            <ScrollView style={styles.textBox} contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.memoText}>{current.text}</Text>
            </ScrollView>

            <View style={styles.countRow}>
                {Array.from({ length: maxCount }).map((_, i) => (
                    <View key={i} style={[styles.dot, i < count && styles.dotFilled]} />
                ))}
            </View>

            <TouchableOpacity style={styles.countBtn} onPress={handleCount} disabled={count >= maxCount}>
                <Text style={styles.countBtnText}>كررت ({count}/{maxCount})</Text>
            </TouchableOpacity>

            {count >= maxCount && (
                <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                    <CheckCircle size={22} color={colors.primary} />
                    <Text style={styles.doneBtnText}>{isLastMemo ? 'إنهاء المراجعة' : 'المحفوظ التالي'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    emptyContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon: { fontSize: 60, marginBottom: 16 },
    emptyTitle: { color: colors.accent, fontSize: 28, fontWeight: '800', marginBottom: 8 },
    emptyText: { color: colors.textSecondary, fontSize: 16, textAlign: 'center', lineHeight: 24 },
    backBtn: { marginTop: 28, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
    backBtnText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    progressText: { color: colors.textSecondary, fontSize: 13 },
    progressBg: { height: 5, backgroundColor: colors.surface, borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
    progressFill: { height: 5, backgroundColor: colors.warning, borderRadius: 3 },
    memoTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 4 },
    reviewDay: { color: colors.textSecondary, fontSize: 13, marginBottom: 14 },
    textBox: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
    },
    memoText: { color: colors.textPrimary, fontSize: 20, lineHeight: 36, fontWeight: '500' },
    countRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 14 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.warning },
    dotFilled: { backgroundColor: colors.warning },
    countBtn: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.warning,
        marginBottom: 10,
    },
    countBtnText: { color: colors.warning, fontSize: 18, fontWeight: '700' },
    doneBtn: {
        backgroundColor: colors.accent,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    doneBtnText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
});

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMemoStore, Memo } from '../store/useMemoStore';
import { colors } from '../theme/colors';
import { LabelBadge } from '../components/LabelBadge';
import { Eye, EyeOff, RefreshCw } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Test'>;

function pickRandom<T>(arr: T[]): T | null {
    if (!arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

export default function TestScreen({ navigation }: Props) {
    const getRandomTestMemos = useMemoStore(s => s.getRandomTestMemos);
    const [current, setCurrent] = useState<Memo | null>(() => pickRandom(getRandomTestMemos()));
    const [revealed, setRevealed] = useState(false);
    const [score, setScore] = useState({ right: 0, wrong: 0 });

    const next = () => {
        const testMemos = getRandomTestMemos();
        setCurrent(pickRandom(testMemos));
        setRevealed(false);
    };

    const handleResult = (correct: boolean) => {
        setScore(s => ({ right: s.right + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }));
        next();
    };

    if (!current) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyTitle}>لا توجد محفوظات مُحكمة بعد</Text>
                <Text style={styles.emptyText}>بعد 30 مراجعة يومية، ستنتقل محفوظاتك إلى الاختبار العشوائي.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>العودة</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Score */}
            <View style={styles.scoreRow}>
                <View style={[styles.scorePill, { backgroundColor: colors.success + '22' }]}>
                    <Text style={[styles.scoreNum, { color: colors.success }]}>✓ {score.right}</Text>
                </View>
                <View style={[styles.scorePill, { backgroundColor: colors.error + '22' }]}>
                    <Text style={[styles.scoreNum, { color: colors.error }]}>✗ {score.wrong}</Text>
                </View>
            </View>

            <LabelBadge label={current.label} />
            <Text style={styles.memoTitle}>{current.title}</Text>
            <Text style={styles.hint}>هل تتذكر هذا المحفوظ؟</Text>

            {/* Hidden text area */}
            <ScrollView style={styles.textBox} contentContainerStyle={{ padding: 20 }}>
                {revealed ? (
                    <Text style={styles.memoText}>{current.text}</Text>
                ) : (
                    <View style={styles.hiddenBox}>
                        <Text style={styles.hiddenHint}>اضغط "اكشف النص" لعرض المحفوظ</Text>
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity style={styles.revealBtn} onPress={() => setRevealed(r => !r)}>
                {revealed
                    ? <EyeOff size={18} color={colors.accent} />
                    : <Eye size={18} color={colors.accent} />
                }
                <Text style={styles.revealBtnText}>{revealed ? 'إخفاء النص' : 'اكشف النص'}</Text>
            </TouchableOpacity>

            {revealed && (
                <View style={styles.resultRow}>
                    <TouchableOpacity style={[styles.resultBtn, styles.wrongBtn]} onPress={() => handleResult(false)}>
                        <Text style={styles.resultBtnText}>لم أتذكره ✗</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.resultBtn, styles.rightBtn]} onPress={() => handleResult(true)}>
                        <Text style={styles.resultBtnText}>حفظته ✓</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.skipBtn} onPress={next}>
                <RefreshCw size={16} color={colors.textMuted} />
                <Text style={styles.skipBtnText}>محفوظ آخر</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    emptyContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon: { fontSize: 60, marginBottom: 16 },
    emptyTitle: { color: colors.accent, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 24 },
    backBtn: { marginTop: 28, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
    backBtnText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
    scoreRow: { flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'flex-end' },
    scorePill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    scoreNum: { fontSize: 14, fontWeight: '700' },
    memoTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 8, marginBottom: 4 },
    hint: { color: colors.textSecondary, fontSize: 14, marginBottom: 14 },
    textBox: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
    },
    memoText: { color: colors.textPrimary, fontSize: 20, lineHeight: 36, fontWeight: '500' },
    hiddenBox: { flex: 1, minHeight: 120, alignItems: 'center', justifyContent: 'center' },
    hiddenHint: { color: colors.textMuted, fontSize: 15, fontStyle: 'italic' },
    revealBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 13,
        borderWidth: 1,
        borderColor: colors.accent,
        marginBottom: 12,
    },
    revealBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
    resultRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    resultBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
    wrongBtn: { backgroundColor: colors.error + '33', borderWidth: 1, borderColor: colors.error },
    rightBtn: { backgroundColor: colors.success + '33', borderWidth: 1, borderColor: colors.success },
    resultBtnText: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    skipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
    skipBtnText: { color: colors.textMuted, fontSize: 13 },
});

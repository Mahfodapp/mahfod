import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMemoStore } from '../store/useMemoStore';
import { colors } from '../theme/colors';
import { CheckCircle, ChevronLeft } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Learn'>;

const { width } = Dimensions.get('window');

export default function LearnScreen({ route, navigation }: Props) {
    const { memoId } = route.params;
    const memo = useMemoStore(s => s.memos.find(m => m.id === memoId));
    const settings = useMemoStore(s => s.settings);
    const completeLearning = useMemoStore(s => s.completeLearning);

    const [count, setCount] = useState(0);
    const [done, setDone] = useState(false);
    const maxCount = settings.initialRepetitions;

    if (!memo) return null;

    const progress = count / maxCount; // 0.0 → 1.0

    // Split text into words for vanishing effect
    const words = memo.text.split(/\s+/);

    // Determine which words should be hidden based on progress
    // As we reach 50% progress, start hiding words; by 100% most are gone
    const getWordOpacity = (index: number): number => {
        if (progress < 0.3) return 1; // first 3 reps: full text
        const vanishProgress = (progress - 0.3) / 0.7; // 0→1 over reps 3→10
        // Use a seed based on index to pseudo-randomly assign vanishing
        const threshold = ((index * 7 + 13) % words.length) / words.length;
        if (threshold < vanishProgress) return 0.08; // nearly invisible
        return 1;
    };

    const handleCount = () => {
        if (done) return;
        const next = count + 1;
        if (next >= maxCount) {
            setCount(next);
            setDone(true);
        } else {
            setCount(next);
        }
    };

    const handleFinish = () => {
        completeLearning(memoId);
        navigation.goBack();
    };

    return (
        <View style={styles.container}>

            {/* Progress bar */}
            <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.countLabel}>التكرار {count} / {maxCount}</Text>
                <Text style={styles.memoTitle}>{memo.title}</Text>
            </View>

            {/* Vanishing text area */}
            <ScrollView style={styles.textScroll} contentContainerStyle={styles.textContent}>
                <View style={styles.wordsWrap}>
                    {words.map((word, i) => (
                        <Text
                            key={i}
                            style={[styles.word, { opacity: getWordOpacity(i) }]}
                        >
                            {word}{' '}
                        </Text>
                    ))}
                </View>
            </ScrollView>

            {/* Counter button */}
            {!done ? (
                <TouchableOpacity style={styles.countBtn} onPress={handleCount} activeOpacity={0.8}>
                    <Text style={styles.countBtnText}>كررت</Text>
                    <Text style={styles.countBtnSub}>اضغط بعد كل تكرار</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.doneBtn} onPress={handleFinish} activeOpacity={0.8}>
                    <CheckCircle size={24} color={colors.primary} />
                    <Text style={styles.doneBtnText}>أتممت الحفظ — حفظ وإضافة للمراجعة</Text>
                </TouchableOpacity>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    progressBg: {
        height: 6,
        backgroundColor: colors.surface,
        borderRadius: 3,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressFill: {
        height: 6,
        backgroundColor: colors.accent,
        borderRadius: 3,
    },
    metaRow: { marginBottom: 20 },
    countLabel: { color: colors.accent, fontSize: 13, fontWeight: '700' },
    memoTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 4 },
    textScroll: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 20,
    },
    textContent: { padding: 20 },
    wordsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    word: {
        color: colors.textPrimary,
        fontSize: 22,
        lineHeight: 38,
        fontWeight: '600',
    },
    countBtn: {
        backgroundColor: colors.primaryLight,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.accent,
    },
    countBtnText: { color: colors.accent, fontSize: 22, fontWeight: '800' },
    countBtnSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
    doneBtn: {
        backgroundColor: colors.accent,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    doneBtnText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
});

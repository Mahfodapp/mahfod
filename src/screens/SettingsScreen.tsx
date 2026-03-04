import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMemoStore } from '../store/useMemoStore';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const REPETITION_OPTIONS = [3, 5, 7, 10, 15, 20];
const VANISH_MODES = [
    { key: 'opacity', label: 'تلاشي تدريجي' },
    { key: 'blur', label: 'تعتيم' },
    { key: 'words', label: 'اختفاء كلمات' },
] as const;

export default function SettingsScreen({ navigation }: Props) {
    const settings = useMemoStore(s => s.settings);
    const updateSettings = useMemoStore(s => s.updateSettings);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>تكرارات الحفظ الأولي</Text>
                <Text style={styles.sectionDesc}>عدد مرات التكرار في جلسة الحفظ الأولى</Text>
                <View style={styles.optionsRow}>
                    {REPETITION_OPTIONS.map(n => (
                        <TouchableOpacity
                            key={n}
                            style={[styles.optionBtn, settings.initialRepetitions === n && styles.optionBtnActive]}
                            onPress={() => updateSettings({ initialRepetitions: n })}
                        >
                            <Text style={[styles.optionText, settings.initialRepetitions === n && styles.optionTextActive]}>{n}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>تكرارات المراجعة اليومية</Text>
                <Text style={styles.sectionDesc}>عدد مرات مراجعة كل محفوظ يومياً</Text>
                <View style={styles.optionsRow}>
                    {REPETITION_OPTIONS.map(n => (
                        <TouchableOpacity
                            key={n}
                            style={[styles.optionBtn, settings.reviewRepetitions === n && styles.optionBtnActive]}
                            onPress={() => updateSettings({ reviewRepetitions: n })}
                        >
                            <Text style={[styles.optionText, settings.reviewRepetitions === n && styles.optionTextActive]}>{n}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>طريقة الاختفاء</Text>
                <Text style={styles.sectionDesc}>كيف يتلاشى النص خلال التكرار</Text>
                {VANISH_MODES.map(m => (
                    <TouchableOpacity
                        key={m.key}
                        style={[styles.modeBtn, settings.vanishMode === m.key && styles.modeBtnActive]}
                        onPress={() => updateSettings({ vanishMode: m.key })}
                    >
                        <Text style={[styles.modeBtnText, settings.vanishMode === m.key && styles.modeBtnTextActive]}>{m.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    💡 قائم على أسلوب التكرار المتباعد (Spaced Repetition) الموثق علمياً لتقوية الذاكرة طويلة الأمد
                </Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    section: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    sectionDesc: { color: colors.textSecondary, fontSize: 13, marginBottom: 14 },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryLight,
        borderWidth: 1,
        borderColor: colors.border,
    },
    optionBtnActive: { backgroundColor: colors.accent + '33', borderColor: colors.accent },
    optionText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
    optionTextActive: { color: colors.accent },
    modeBtn: {
        padding: 13,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 8,
        backgroundColor: colors.primaryLight,
    },
    modeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
    modeBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600', textAlign: 'center' },
    modeBtnTextActive: { color: colors.accent },
    infoBox: {
        backgroundColor: colors.accent + '11',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.accent + '33',
        marginTop: 8,
    },
    infoText: { color: colors.textGold, fontSize: 14, lineHeight: 22, textAlign: 'center' },
});

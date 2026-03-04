import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useMemoStore } from '../store/useMemoStore';
import { colors } from '../theme/colors';
import { BookOpen, Star, Shuffle, Plus, Settings, List } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
    const memos = useMemoStore(s => s.memos);
    const getTodayReviewMemos = useMemoStore(s => s.getTodayReviewMemos);
    const getRandomTestMemos = useMemoStore(s => s.getRandomTestMemos);

    const learningCount = memos.filter(m => m.stage === 'LEARNING').length;
    const reviewCount = getTodayReviewMemos().length;
    const testCount = getRandomTestMemos().length;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>حاضرة مليانة</Text>
                        <Text style={styles.title}>تطبيق محفوظ</Text>
                        <Text style={styles.subtitle}>طريقك إلى الحفظ المتقن</Text>
                    </View>
                    <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
                        <Settings size={22} color={colors.accent} />
                    </TouchableOpacity>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <StatCard label="قيد الحفظ" value={learningCount} color={colors.info} />
                    <StatCard label="للمراجعة" value={reviewCount} color={colors.warning} />
                    <StatCard label="محكم" value={memos.filter(m => m.stage === 'MASTERED').length} color={colors.success} />
                </View>

                {/* Action cards */}
                <Text style={styles.sectionTitle}>ابدأ جلستك</Text>

                <ActionCard
                    icon={<BookOpen size={28} color={colors.accent} />}
                    title="حفظ محفوظ جديد"
                    subtitle="ابدأ حفظ متن أو شعر أو حديث جديد"
                    badge={learningCount}
                    badgeColor={colors.info}
                    onPress={() => navigation.navigate('MemoList')}
                />

                <ActionCard
                    icon={<Star size={28} color={colors.warning} />}
                    title="المراجعة اليومية"
                    subtitle={reviewCount > 0 ? `لديك ${reviewCount} محفوظ للمراجعة اليوم` : 'أحسنت! أنهيت مراجعة اليوم'}
                    badge={reviewCount}
                    badgeColor={colors.warning}
                    onPress={() => navigation.navigate('Review')}
                />

                <ActionCard
                    icon={<Shuffle size={28} color={colors.success} />}
                    title="الاختبار العشوائي"
                    subtitle="اختبر نفسك في المحفوظات القديمة"
                    badge={testCount}
                    badgeColor={colors.success}
                    onPress={() => navigation.navigate('Test')}
                />

                {/* Quick add */}
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMemo')}>
                    <Plus size={20} color={colors.primary} />
                    <Text style={styles.addBtnText}>أضف محفوظاً جديداً</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.listBtn} onPress={() => navigation.navigate('MemoList')}>
                    <List size={18} color={colors.textSecondary} />
                    <Text style={styles.listBtnText}>عرض جميع المحفوظات</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={[styles.statCard, { borderColor: color + '44' }]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function ActionCard({
    icon, title, subtitle, badge, badgeColor, onPress
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    badge: number;
    badgeColor: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.iconBox, { borderColor: badgeColor + '44' }]}>
                {icon}
            </View>
            <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
            {badge > 0 && (
                <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 28,
        marginTop: 16,
    },
    brand: { color: colors.textGold, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
    title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 2 },
    subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
    settingsBtn: {
        backgroundColor: colors.surface,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
    },
    statValue: { fontSize: 26, fontWeight: '800' },
    statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' },
    sectionTitle: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    actionCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 14,
        borderWidth: 1,
    },
    actionText: { flex: 1 },
    actionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
    actionSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
    badge: {
        minWidth: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    addBtn: {
        backgroundColor: colors.accent,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    addBtnText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
    listBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
    },
    listBtnText: { color: colors.textSecondary, fontSize: 14 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth.store';
import { useMemoStore } from '../store/memo.store';
import { useSettingsStore } from '../store/settings.store';
import { Settings, Search, BookOpen, PlusCircle, Shuffle, Star } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { user, isGuest } = useAuthStore();
  const { memos, fetchMemos } = useMemoStore();
  const { settings } = useSettingsStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const totalMemos = memos.length;
  const learningCount = memos.filter((m) => m.stage === 'LEARNING').length;
  const reviewCount = memos.filter((m) => m.stage === 'REVIEWING').length;
  const masteredCount = memos.filter((m) => m.stage === 'MASTERED').length;
  
  // Calculate due today
  const now = new Date();
  const dueCount = memos.filter((m) => {
    if (m.stage !== 'REVIEWING') return false;
    if (!m.next_review_at) return true;
    return new Date(m.next_review_at) <= now;
  }).length;

  const streak = 0; // Replace with actual streak from settings or kv later

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER ROW */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('SettingsScreen')}>
          <Settings color={colors.accent} size={20} />
        </TouchableOpacity>
        <Text style={styles.logo}>{t('home.logo', 'محفوظ')}</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Search color={colors.accent} size={20} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* GREETING */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.greetingSection}>
          {user && !isGuest ? (
            <Text style={styles.greetingTitle}>
              {t('home.greeting', 'السلام عليكم ،')} <Text style={styles.username}>{user.user_metadata?.full_name || user.email?.split('@')[0] || t('home.user', 'المستخدم')}</Text>
            </Text>
          ) : (
            <Text style={styles.guestTitle}>{t('home.guestTitle', 'قليلٌ دائم خير من كثير منقطع')}</Text>
          )}
          <Text style={styles.quote}>
            {t('home.quote', 'ليس بعلم ما حوى القمطر — ما العلم إلا ما حواه الصدر')}
          </Text>
        </Animated.View>

        {/* STATS CARD */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.cardContainer}>
          <View style={styles.cardBg}>
            {activeSlide === 0 && (
              <Animated.View entering={FadeInUp} style={styles.slide1}>
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>{totalMemos}</Text>
                  <Text style={styles.statLabel}>{t('home.stats.total', 'إجمالي المحفوظات')}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>{reviewCount}</Text>
                  <Text style={styles.statLabel}>{t('home.stats.review', 'المراجعة')}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>{streak}</Text>
                  <Text style={styles.statLabel}>{t('home.stats.streak', 'السلسلة')}</Text>
                </View>
              </Animated.View>
            )}
            {activeSlide === 1 && (
              <Animated.View entering={FadeInUp} style={styles.slide2}>
                <Text style={styles.stageText}>
                  <Text style={{ color: colors.stageLearning }}>{t('stages.learning', 'يُحفظ')} [{learningCount}]</Text> ·{' '}
                  <Text style={{ color: colors.stageReview }}>{t('stages.reviewing', 'مراجعة')} [{reviewCount}]</Text> ·{' '}
                  <Text style={{ color: colors.stageMastered }}>{t('stages.mastered', 'محكم')} [{masteredCount}]</Text>
                </Text>
              </Animated.View>
            )}
            {activeSlide === 2 && (
              <Animated.View entering={FadeInUp} style={styles.slide3}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Star color={colors.accent} size={24} />
                  <Text style={styles.streakText}>{streak} يوم متواصل</Text>
                </View>
              </Animated.View>
            )}
          </View>
          <View style={styles.pagination}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity key={i} onPress={() => setActiveSlide(i)}>
                <View style={[styles.dot, activeSlide === i && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ACTION GRID */}
        <View style={styles.grid}>
          <Animated.View entering={FadeInDown.delay(400).springify()} style={{ width: '47%', aspectRatio: 1 }}>
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('MemoLibraryScreen')}>
              <BookOpen color={colors.accent} size={28} />
              <Text style={styles.gridLabel}>المحفوظات</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(500).springify()} style={{ width: '47%', aspectRatio: 1 }}>
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AddMemoScreen')}>
              <PlusCircle color={colors.accent} size={28} />
              <Text style={styles.gridLabel}>+ إضافة محفوظ جديد</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(600).springify()} style={{ width: '47%', aspectRatio: 1 }}>
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('MohkamSessionScreen')}>
              <Shuffle color={colors.accent} size={28} />
              <Text style={styles.gridLabel}>الاختبار</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(700).springify()} style={{ width: '47%', aspectRatio: 1 }}>
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ReviewSessionScreen')}>
              <Star color={colors.accent} size={28} />
              <Text style={styles.gridLabel}>المراجعة</Text>
              {dueCount > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </Animated.View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  logo: {
    color: colors.accent,
    fontSize: 24, fontWeight: '800',
    textShadowColor: colors.accent,
    textShadowRadius: 10,
  },
  scroll: { padding: 20 },
  greetingSection: { marginBottom: 24 },
  greetingTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
  username: { color: colors.accent },
  guestTitle: { fontSize: 16, fontStyle: 'italic', color: colors.textSecondary, textAlign: 'right' },
  quote: { color: colors.textMuted, fontSize: 13, textAlign: 'right', marginTop: 8 },
  cardContainer: {
    backgroundColor: colors.primaryLight,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  cardBg: { padding: 20, minHeight: 120, justifyContent: 'center' },
  slide1: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center' },
  statCol: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.accent },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  slide2: { alignItems: 'center' },
  stageText: { fontSize: 16, fontWeight: '700' },
  slide3: { alignItems: 'center' },
  streakText: { fontSize: 24, fontWeight: '800', color: colors.accent },
  pagination: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 16, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.16)' },
  dotActive: { backgroundColor: colors.accent },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 16 },
  gridItem: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  gridLabel: { color: colors.textPrimary, fontSize: 13, textAlign: 'center', marginTop: 8 },
  badge: {
    position: 'absolute', top: 16, right: 16,
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error,
  },
});

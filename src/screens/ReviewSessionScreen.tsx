import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import Button from '../components/ui/Button';
import { useSettingsStore } from '../store/settings.store';
import { useMemoStore } from '../store/memo.store';
import { useNavigation } from '@react-navigation/native';
import { Star, X, Play, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle, withTiming, withSpring, FadeIn, FadeInDown, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Memo } from '../types';
import * as memoService from '../services/memo.service';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

export default function ReviewSessionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReviewSessionScreen'>>();
  const navigation = useNavigation<any>();
  const { settings } = useSettingsStore();
  const { recordRepetition } = useMemoStore(); // We'll use service directly to avoid local state issues, or we use store if it returns promise. It does.
  const { t } = useTranslation();
  
  const [queue, setQueue] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        const hasSeenBanner = await AsyncStorage.getItem('hasSeenReviewBanner');
        if (!hasSeenBanner) {
          setShowBanner(true);
        }

        if (route.params?.memoId) {
          const initialMemo = await memoService.getMemoById(route.params.memoId);
          setQueue(initialMemo ? [initialMemo] : []);
          if (!initialMemo) setSessionComplete(true);
        } else {
          const dueMemos = await memoService.getMemosDueToday();
          const limit = settings.daily_review_count || 5;
          const toReview = dueMemos.slice(0, limit);
          
          setQueue(toReview);
          if (toReview.length === 0) {
            setSessionComplete(true);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [settings.daily_review_count, route.params?.memoId]);

  const progressStyle = useAnimatedStyle(() => {
    const progress = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0;
    return {
      width: withSpring(`${progress}%`, { damping: 15, stiffness: 100 }),
    };
  });

  const dismissBanner = async () => {
    setShowBanner(false);
    await AsyncStorage.setItem('hasSeenReviewBanner', 'true');
  };

  const handleExit = () => {
    Alert.alert(t('review.exitTitle', 'إنهاء الجلسة'), t('review.exitMessage', 'هل أنت متأكد من رغبتك في الخروج؟'), [
      { text: t('common.cancel', 'إلغاء'), style: 'cancel' },
      { text: t('review.exitConfirm', 'نعم، أخرج'), style: 'destructive', onPress: () => navigation.goBack() }
    ]);
  };

  const adjustFontSize = (delta: number) => {
    setFontSizeScale(prev => Math.min(Math.max(prev + delta, 0.6), 1.6));
  };

  const handleTap = async () => {
    if (showSuccessIcon) return; // Prevent tapping while animating
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newRep = repCount + 1;
    setRepCount(newRep);

    const requiredReps = settings.initial_reps; 

    if (newRep >= requiredReps) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessIcon(true);
      const currentMemo = queue[currentIndex];
      await recordRepetition(currentMemo.id);
      
      setTimeout(() => {
        setShowSuccessIcon(false);
        setRepCount(0);
        if (currentIndex + 1 >= queue.length) {
          setSessionComplete(true);
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      }, 600);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><Text style={{ color: '#fff', textAlign: 'center' }}>جاري التحميل...</Text></SafeAreaView>;
  }

  if (sessionComplete) {
    if (queue.length === 0) {
      return (
        <SafeAreaView style={styles.container}>
          <Animated.View entering={FadeInDown.springify()} style={styles.emptyCenter}>
            <Check color={colors.success} size={64} />
            <Text style={styles.emptyTitle}>{t('review.emptyTitle', 'لا يوجد للمراجعة اليوم')}</Text>
            <Text style={styles.emptySub}>{t('review.emptySub', 'أتممت مراجعة اليوم')}</Text>
            <Button variant="secondary" label={t('review.backHome', 'العودة للرئيسية')} onPress={() => navigation.navigate('HomeTab')} />
          </Animated.View>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeInDown.springify()} style={styles.emptyCenter}>
          <Star color={colors.accent} size={64} />
          <Text style={styles.allDoneTitle}>{t('review.doneTitle', 'أحسنت!')}</Text>
          <Text style={styles.allDoneSub}>{t('review.doneSub', 'أتممت مراجعة اليوم')}</Text>
          <Button variant="primary" label={t('review.finish', 'إنهاء المراجعة')} onPress={() => navigation.navigate('HomeTab')} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  const memo = queue[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Star color={colors.textMuted} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المراجعة اليومية</Text>
        <TouchableOpacity onPress={handleExit}>
          <Text style={styles.cancelText}>إلغاء</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.counterText}>{currentIndex + 1} / {queue.length}</Text>
        
        {/* MEMO HEADERS */}
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <Text style={styles.sourceText}>{memo.label || 'بدون مصدر'}</Text>
          <Text style={styles.memoTitle}>{memo.title}</Text>
          <Text style={styles.reviewDayText}>مراجعة اليوم {memo.review_count + 1} / {settings.review_days}</Text>
        </View>

        {showBanner && (
          <View style={styles.banner}>
            <TouchableOpacity onPress={dismissBanner} style={{ padding: 4 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.bannerText}>
              ستُراجع هذا المحفوظ لمدة 30 يوماً لترسيخه في الذاكرة طويلة الأمد.
            </Text>
          </View>
        )}

        {/* FONT CONTROLS */}
        <View style={styles.fontControls}>
          <TouchableOpacity style={styles.fontBtn}><Text style={styles.fontBtnText}>كوفي</Text></TouchableOpacity>
          <TouchableOpacity style={styles.fontBtn} onPress={() => adjustFontSize(0.1)}><Text style={styles.fontBtnText}>+أ</Text></TouchableOpacity>
          <Text style={styles.fontScaleText}>{Math.round(fontSizeScale * 100)}%</Text>
          <TouchableOpacity style={styles.fontBtn} onPress={() => adjustFontSize(-0.1)}><Text style={styles.fontBtnText}>-أ</Text></TouchableOpacity>
        </View>

        {/* MEMO CARD WITH REANIMATED TRANSITION */}
        <Animated.View key={memo.id} entering={SlideInRight.springify()} exiting={SlideOutLeft.springify()} style={styles.memoCard}>
          {memo.image_url ? (
            <Image source={{ uri: memo.image_url }} style={styles.memoImage} />
          ) : null}

          {memo.is_poem ? (
            <View>
              <Text style={[styles.memoText, { fontSize: 18 * fontSizeScale }]}>{memo.text.split('***')[0]}</Text>
              <View style={styles.poemDivider} />
              <Text style={[styles.memoText, { fontSize: 18 * fontSizeScale }]}>{memo.text.split('***')[1]}</Text>
            </View>
          ) : (
            <Text style={[styles.memoText, { fontSize: 18 * fontSizeScale }]}>{memo.text}</Text>
          )}

          {memo.audio_url && (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Play color={colors.accent} size={32} />
            </View>
          )}
        </Animated.View>

        {/* DOTS */}
        <View style={styles.dotsRow}>
          {queue.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

      </ScrollView>

      {/* STICKY BOTTOM */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity style={styles.repBtn} onPress={handleTap}>
          {showSuccessIcon ? (
            <Animated.View entering={FadeIn}>
              <Check color={colors.primary} size={24} />
            </Animated.View>
          ) : (
            <Text style={styles.repBtnText}>كررت ({repCount} / {settings.initial_reps})</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cancelText: { color: colors.error, fontSize: 14 },
  progressBg: { height: 2, backgroundColor: 'rgba(255,255,255,0.08)', width: '100%' },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  
  scroll: { padding: 24, paddingBottom: 100 },
  counterText: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
  sourceText: { color: colors.textMuted, fontSize: 12 },
  memoTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginVertical: 8 },
  reviewDayText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  
  banner: { 
    backgroundColor: 'rgba(204,255,0,0.08)', borderLeftWidth: 3, borderLeftColor: colors.accent,
    borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', marginVertical: 16,
    justifyContent: 'space-between'
  },
  bannerText: { flex: 1, color: colors.textSecondary, fontSize: 12, textAlign: 'right', marginLeft: 8 },
  
  fontControls: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 },
  fontBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 0.5, borderColor: colors.border },
  fontBtnText: { color: colors.textPrimary, fontSize: 14 },
  fontScaleText: { color: colors.textMuted, fontSize: 14 },
  
  memoCard: { backgroundColor: colors.primaryLight, borderRadius: 20, padding: 24, minHeight: 200, justifyContent: 'center' },
  memoText: { color: colors.textPrimary, textAlign: 'center', lineHeight: 32 },
  poemDivider: { height: 1, backgroundColor: colors.border, width: '40%', alignSelf: 'center', marginVertical: 16 },
  memoImage: { width: '100%', maxHeight: 200, borderRadius: 12, marginBottom: 16 },
  
  dotsRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 6, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.16)' },
  dotActive: { width: 20, backgroundColor: colors.accent },
  
  stickyBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.primary, borderTopWidth: 0.5, borderTopColor: colors.border },
  repBtn: { backgroundColor: colors.accent, borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', justifyContent: 'center', height: 56 },
  repBtnText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, color: colors.textSecondary, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  allDoneTitle: { fontSize: 28, fontWeight: '800', color: colors.accent, marginTop: 16 },
  allDoneSub: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
});

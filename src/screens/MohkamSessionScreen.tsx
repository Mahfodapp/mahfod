import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import * as memoService from '../services/memo.service';
import { Memo } from '../types';
import Button from '../components/ui/Button';
import { X, Eye, Check, XCircle, Award, Star } from 'lucide-react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export default function MohkamSessionScreen() {
  const navigation = useNavigation<any>();
  const [queue, setQueue] = useState<Memo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  const [rememberedCount, setRememberedCount] = useState(0);
  const [forgotCount, setForgotCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const mastered = await memoService.getMasteredMemos();
        setQueue(mastered);
        if (mastered.length === 0) setSessionComplete(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleExit = () => {
    Alert.alert('إنهاء', 'هل تريد إنهاء جلسة المحكم؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم', style: 'destructive', onPress: () => navigation.goBack() }
    ]);
  };

  const flip = useSharedValue(0);

  const handleReveal = () => {
    setIsRevealed(true);
    flip.value = withTiming(1, { duration: 600 });
  };

  const advance = () => {
    setIsRevealed(false);
    flip.value = 0;
    if (currentIndex + 1 >= queue.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRemembered = () => {
    setRememberedCount(prev => prev + 1);
    advance();
  };

  const handleForgot = async () => {
    const memo = queue[currentIndex];
    setForgotCount(prev => prev + 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    try {
      await memoService.updateMemo(memo.id, {
        stage: 'REVIEWING',
        review_count: 0,
        next_review_at: tomorrow.toISOString()
      });
    } catch (e) {
      console.error(e);
    }
    advance();
  };

  const frontStyle = useAnimatedStyle(() => {
    const spin = flip.value * 180;
    return {
      transform: [{ rotateX: `${spin}deg` }],
      backfaceVisibility: 'hidden',
      opacity: flip.value < 0.5 ? 1 : 0,
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const spin = flip.value * 180 + 180;
    return {
      transform: [{ rotateX: `${spin}deg` }],
      backfaceVisibility: 'hidden',
      opacity: flip.value >= 0.5 ? 1 : 0,
      justifyContent: 'center',
    };
  });

  if (loading) {
    return <SafeAreaView style={styles.container}><Text style={{ color: '#fff', textAlign: 'center' }}>جاري التحميل...</Text></SafeAreaView>;
  }

  if (sessionComplete) {
    if (queue.length === 0) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyCenter}>
            <Award color={colors.accent} size={64} />
            <Text style={styles.emptyTitle}>لا توجد محفوظات محكمة حالياً</Text>
            <Button variant="primary" label="العودة" onPress={() => navigation.goBack()} />
          </View>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyCenter}>
          <Star color={colors.accent} size={64} />
          <Text style={styles.doneTitle}>أحسنت! انتهت جلسة المحكم</Text>
          <Text style={styles.doneSub}>تذكرت: {rememberedCount} | نسيت: {forgotCount}</Text>
          <Button variant="primary" label="العودة للرئيسية" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const memo = queue[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>جلسة المحكم</Text>
          <Text style={styles.headerSubtitle}>اختبار المحفوظات المحكمة</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleExit}>
          <X color={colors.textPrimary} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.progressText}>{currentIndex + 1} / {queue.length}</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.memoTitle}>{memo.title}</Text>
        
        <View style={styles.memoCard}>
          <Animated.View style={frontStyle} pointerEvents={isRevealed ? 'none' : 'auto'}>
            <View style={styles.hiddenState}>
              <Text style={styles.hiddenText}>▬▬▬▬▬▬▬▬▬▬▬</Text>
              <Text style={styles.hiddenText}>▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬</Text>
              <Text style={styles.hiddenText}>▬▬▬▬▬▬▬▬▬▬</Text>
            </View>
          </Animated.View>
          
          <Animated.View style={backStyle} pointerEvents={!isRevealed ? 'none' : 'auto'}>
            {memo.is_poem ? (
              <View>
                <Text style={styles.revealedText}>{memo.text.split('***')[0]}</Text>
                <View style={styles.poemDivider} />
                <Text style={styles.revealedText}>{memo.text.split('***')[1]}</Text>
              </View>
            ) : (
              <Text style={styles.revealedText}>{memo.text}</Text>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        {!isRevealed ? (
          <Button 
            variant="secondary" 
            label="إظهار النص" 
            icon={<Eye color={colors.accent} size={20} />} 
            onPress={handleReveal} 
          />
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.successBtn} onPress={handleRemembered}>
              <Check color={colors.success} size={24} />
              <Text style={styles.successBtnText}>تذكرت</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dangerBtn} onPress={handleForgot}>
              <XCircle color={colors.error} size={24} />
              <Text style={styles.dangerBtnText}>لم أتذكر</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: colors.textMuted },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  progressText: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 8 },
  scroll: { padding: 24, paddingBottom: 100 },
  memoTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 32 },
  memoCard: { backgroundColor: colors.primaryLight, borderRadius: 20, padding: 24, minHeight: 250, justifyContent: 'center', borderWidth: 0.5, borderColor: colors.border },
  hiddenState: { alignItems: 'center', gap: 16 },
  hiddenText: { color: 'rgba(255,255,255,0.1)', fontSize: 24 },
  revealedText: { color: colors.textPrimary, fontSize: 18, textAlign: 'center', lineHeight: 32 },
  poemDivider: { height: 1, backgroundColor: colors.border, width: '40%', alignSelf: 'center', marginVertical: 16 },
  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: colors.primary, borderTopWidth: 0.5, borderTopColor: colors.border },
  actionRow: { flexDirection: 'row-reverse', gap: 16 },
  successBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,237,180,0.12)', borderWidth: 1, borderColor: colors.success, borderRadius: 16, padding: 16, gap: 8 },
  successBtnText: { color: colors.success, fontSize: 18, fontWeight: '700' },
  dangerBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,115,81,0.12)', borderWidth: 1, borderColor: colors.error, borderRadius: 16, padding: 16, gap: 8 },
  dangerBtnText: { color: colors.error, fontSize: 18, fontWeight: '700' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  emptyTitle: { fontSize: 18, color: colors.textSecondary },
  doneTitle: { fontSize: 24, fontWeight: '800', color: colors.accent },
  doneSub: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
});

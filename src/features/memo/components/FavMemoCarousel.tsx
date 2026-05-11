import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MText } from '@/shared/ui/MText';
import { useNavigation } from '@react-navigation/native';
import { Star } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useMemoStore } from '../store/memo.store';
import { colors, spacing, radius, fonts } from '@/shared/theme';
import IslamicPatternBg from '@/shared/ui/IslamicPatternBg';

const STAGE_COLORS: Record<string, string> = {
  LEARNING: colors.stageLearning,
  REVISION: colors.stageReview,
  MASTERED: colors.stageMastered,
};

const STAGE_LABELS: Record<string, string> = {
  LEARNING: 'يُحفظ',
  REVISION: 'مراجعة',
  MASTERED: 'محكم',
};

function MemoCard({ memo, index }: { memo: Memo; index: number }) {
  const navigation = useNavigation<any>();
  const opacity = useSharedValue(0);
  const tx = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withSpring(1, { damping: 18 }));
    tx.value = withDelay(index * 60, withSpring(0, { damping: 16 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }],
  }));

  const stageColor = STAGE_COLORS[memo.stage] ?? colors.accent;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('MemoViewScreen', { memoId: memo.id });
        }}
        activeOpacity={0.85}
      >
        <IslamicPatternBg opacity={0.05} absolute />

        {/* Stage dot */}
        <View style={[styles.stageDot, { backgroundColor: stageColor }]} />

        <MText weight="bold" style={styles.title} numberOfLines={2}>
          {memo.title}
        </MText>

        {memo.label ? (
          <MText weight="regular" style={styles.label} numberOfLines={1}>
            {memo.label}
          </MText>
        ) : null}

        <View style={styles.footer}>
          <MText weight="semi" style={[styles.stage, { color: stageColor }]}>
            {STAGE_LABELS[memo.stage]}
          </MText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function FavMemoCarousel() {
  const memos = useMemoStore(s => s.memos);
  const favMemos = memos.filter(m => m.is_favorite).slice(0, 12);

  if (favMemos.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Star size={16} color={colors.accent} fill={colors.accent} />
        <MText weight="bold" style={styles.sectionTitle}>المفضلة</MText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {favMemos.map((m, i) => (
          <MemoCard key={m.id} memo={m} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  scroll: {
    gap: 12,
    paddingRight: 20,
  },
  card: {
    width: 160,
    height: 140,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    padding: spacing.md,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 4,
  },
  footer: {
    marginTop: 8,
  },
  stage: {
    fontFamily: fonts.semi,
    fontSize: 11,
  },
});

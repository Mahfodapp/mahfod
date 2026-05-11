import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { useNavigation } from '@react-navigation/native';
import { BookMarked, ChevronLeft } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import IslamicPatternBg from '@/shared/ui/IslamicPatternBg';
import { colors, spacing, radius, fonts } from '@/shared/theme';

export function NoterButton() {
  const navigation = useNavigation<any>();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.96, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    // Navigate to the NoterTab in bottom tabs
    navigation.navigate('MainTabs', { screen: 'NoterTab' });
  };

  return (
    <Animated.View style={[styles.wrap, animStyle]}>
      <TouchableOpacity style={styles.btn} onPress={handlePress} activeOpacity={1}>
        <IslamicPatternBg opacity={0.07} absolute />

        <View style={styles.left}>
          <View style={styles.iconBox}>
            <BookMarked size={24} color={colors.primary} strokeWidth={1.8} />
          </View>
          <View>
            <MText weight="extra" style={styles.title}>المطالعات</MText>
            <MText weight="regular" style={styles.sub}>دفتر الفوائد والتقييد</MText>
          </View>
        </View>

        <ChevronLeft size={20} color={colors.accent} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.xl + 4 },
  btn: {
    height: 72, backgroundColor: colors.accent, borderRadius: radius.xl,
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: spacing.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  title: { color: colors.primary, fontFamily: fonts.extra, fontSize: 16 },
  sub: { color: 'rgba(0,0,0,0.55)', fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
});

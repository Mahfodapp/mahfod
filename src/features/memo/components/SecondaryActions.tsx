import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { useNavigation } from '@react-navigation/native';
import { Brain, Sparkles } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import IslamicPatternBg from '@/shared/ui/IslamicPatternBg';
import { colors, spacing, radius, typography, fonts } from '@/shared/theme';

interface SecBtn {
  label: string;
  sub: string;
  Icon: React.ElementType;
  onPress: () => void;
  tint?: string;
}

function SecondaryBtn({ btn }: { btn: SecBtn }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.94, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    btn.onPress();
  };

  return (
    <Animated.View style={[styles.btnWrap, animStyle]}>
      <TouchableOpacity style={styles.btn} onPress={handlePress} activeOpacity={1}>
        <IslamicPatternBg opacity={0.05} absolute />
        <View style={styles.row}>
          <View style={[styles.iconBox, btn.tint ? { borderColor: btn.tint, backgroundColor: `${btn.tint}15` } : {}]}>
            <btn.Icon size={22} color={btn.tint ?? colors.accent} strokeWidth={1.7} />
          </View>
          <View style={styles.textCol}>
            <MText weight="bold" style={[styles.label, btn.tint ? { color: btn.tint } : {}]}>{btn.label}</MText>
            <MText weight="regular" style={styles.sub}>{btn.sub}</MText>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function SecondaryActions() {
  const navigation = useNavigation<any>();

  const BTNS: SecBtn[] = [
    {
      label: 'علم الحفظ',
      sub: 'تقنيات وأسرار التثبيت',
      Icon: Brain,
      onPress: () => {},
    },
    {
      label: 'وظائف الذكاء الاصطناعي',
      sub: 'مساعد الحفظ الذكي',
      Icon: Sparkles,
      tint: colors.catMatn,
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      {BTNS.map(b => (
        <SecondaryBtn key={b.label} btn={b} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, marginBottom: spacing.xl + 4 },
  btnWrap: { borderRadius: radius.lg + 2, overflow: 'hidden' },
  btn: {
    height: 70, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg + 2,
    borderWidth: 1, borderColor: colors.accentBorder, overflow: 'hidden',
    justifyContent: 'center', paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  textCol: { flex: 1 },
  label: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15 },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});

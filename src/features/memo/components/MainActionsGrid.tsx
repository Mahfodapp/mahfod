import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MText } from '@/shared/ui/MText';
import { useNavigation } from '@react-navigation/native';
import {
  Plus,
  BookOpen,
  RefreshCw,
  Award,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import IslamicPatternBg from '@/shared/ui/IslamicPatternBg';
import { colors, spacing, radius, fonts } from '@/shared/theme';

interface ActionDef {
  label: string;
  Icon: React.ElementType;
  route: string;
  params?: object;
  highlight?: boolean;
}

const ACTIONS: ActionDef[] = [
  { label: 'إضافة محفوظ',  Icon: Plus,      route: 'AddMemoScreen',     highlight: true },
  { label: 'المحفوظات',    Icon: BookOpen,  route: 'MemoLibraryScreen' },
  { label: 'المراجعة',     Icon: RefreshCw, route: 'ReviewSessionScreen' },
  { label: 'المحكمات',     Icon: Award,     route: 'MohkamSessionScreen' },
];

function ActionButton({ action }: { action: ActionDef }) {
  const navigation = useNavigation<any>();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.92, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    navigation.navigate(action.route, action.params);
  };

  return (
    <Animated.View style={[styles.btnWrap, animStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.btn,
          action.highlight && styles.btnHighlight,
        ]}
        activeOpacity={1}
      >
        <IslamicPatternBg opacity={0.06} absolute />

        <View style={[
          styles.iconCircle,
          action.highlight && styles.iconCircleHighlight,
        ]}>
          <action.Icon
            size={26}
            color={action.highlight ? colors.primary : colors.accent}
            strokeWidth={1.8}
          />
        </View>

        <MText weight="bold" style={[
          styles.label,
          action.highlight && styles.labelHighlight,
        ]}>
          {action.label}
        </MText>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function MainActionsGrid() {
  return (
    <View style={styles.grid}>
      {ACTIONS.map(a => (
        <ActionButton key={a.label} action={a} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  btnWrap: {
    width: '47.5%',
  },
  btn: {
    height: 114,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  btnHighlight: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,    // rgba(204,255,0,0.10)
    borderWidth: 1,
    borderColor: colors.borderAccent,      // rgba(204,255,0,0.25)
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleHighlight: {
    backgroundColor: 'rgba(0,0,0,0.15)',   // no token — dark overlay on accent bg
    borderColor: 'rgba(0,0,0,0.20)',
  },
  label: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  labelHighlight: {
    color: colors.primary,
  },
});

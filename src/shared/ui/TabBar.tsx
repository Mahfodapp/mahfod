import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { MText } from './MText';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Moon, Plus, BookMarked, Wrench } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const ICONS = {
  HomeTab:   Home,
  QuranTab:  Moon,
  NoterTab:  BookMarked,
  ToolsTab:  Wrench,
};

const LABELS = {
  HomeTab:  'الرئيسية',
  QuranTab: 'القرآن',
  NoterTab: 'المطالعات',
  ToolsTab: 'أدوات',
};

function TabItem({
  route,
  isFocused,
  isPlaceholder,
  onPress,
}: {
  route: any;
  isFocused: boolean;
  isPlaceholder: boolean;
  onPress: () => void;
}) {
  const IconComponent = ICONS[route.name as keyof typeof ICONS];
  const label = LABELS[route.name as keyof typeof LABELS];

  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    dotOpacity.value = withSpring(isFocused ? 1 : 0, { damping: 14 });
    if (isFocused) {
      scale.value = withSpring(1.18, { damping: 9, stiffness: 280 }, () => {
        scale.value = withSpring(1, { damping: 12 });
      });
    }
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    width: interpolate(dotOpacity.value, [0, 1], [0, 16], Extrapolation.CLAMP),
    opacity: dotOpacity.value,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 4,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tab, isPlaceholder && styles.dimmed]}
      activeOpacity={isPlaceholder ? 1 : 0.7}
    >
      <Animated.View style={iconStyle}>
        {IconComponent && (
          <IconComponent
            size={22}
            color={isFocused ? colors.accent : colors.textMuted}
            strokeWidth={isFocused ? 2 : 1.6}
          />
        )}
      </Animated.View>
      <MText weight={isFocused ? 'bold' : 'semi'} style={[styles.label, isFocused && styles.labelFocused]}>
        {label}
      </MText>
      <Animated.View style={dotStyle} />
    </TouchableOpacity>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const fabScale = useSharedValue(1);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabScale.value = withSpring(0.86, { damping: 10 }, () => {
      fabScale.value = withSpring(1, { damping: 12 });
    });
    navigation.navigate('AddMemoScreen');
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8) },
      ]}
    >
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          if (route.name === 'CenterFabPlaceholder') return null;

          const isFocused = state.index === index;
          const isPlaceholder = route.name === 'QuranTab';

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (isPlaceholder) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              isPlaceholder={isPlaceholder}
              onPress={onPress}
            />
          );
        })}
      </View>

      {/* ── Center FAB ─────────────────────── */}
      <View style={[styles.fabWrap, { bottom: Math.max(insets.bottom + 10, 18) }]}>
        {/* Glow ring */}
        <View style={styles.fabGlow} />
        <Animated.View style={fabStyle}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleFab}
            activeOpacity={1}
          >
            <Plus size={30} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  tabRow: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 4,
  },
  dimmed: {
    opacity: 0.25,
  },
  label: {
    fontFamily: fonts.semi,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  labelFocused: {
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  // FAB
  fabWrap: {
    position: 'absolute',
    left: '50%',
    marginLeft: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    opacity: 0.22,
    transform: [{ scale: 1.6 }],
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 12,
  },
});

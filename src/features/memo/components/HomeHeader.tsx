import React, { useEffect } from 'react';
import { StyleSheet, Image, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Settings, Search } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '@/shared/theme';

export function HomeHeader() {
  const navigation = useNavigation<any>();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const gearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Search — left */}
      <TouchableOpacity
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        style={styles.iconBtn}
        activeOpacity={0.7}
      >
        <Search size={24} color={colors.accent} strokeWidth={1.6} />
      </TouchableOpacity>

      {/* Logo image */}
      <Image
        source={require('../../../../assets/images/mahfodap_title.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />

      {/* Settings — rotating gear, right */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('SettingsScreen');
        }}
        style={styles.iconBtn}
        activeOpacity={0.7}
      >
        <Animated.View style={gearStyle}>
          <Settings size={24} color={colors.accent} strokeWidth={1.6} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,   // closest token to 0.07 — 0.10
    borderWidth: 1,
    borderColor: colors.accentBorder,     // rgba(204,255,0,0.22)
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    height: 36,
    width: 160,
  },
});

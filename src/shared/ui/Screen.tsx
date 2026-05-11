import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const { width: SW, height: SH } = Dimensions.get('screen');

interface Props {
  children: React.ReactNode;
  /** Content rendered above the ScrollView — stays fixed on scroll */
  header?: React.ReactNode;
}

export function Screen({ children, header }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ── Islamic pattern — fixed, behind everything ── */}
      <View style={styles.patternLayer} pointerEvents="none">
        <Image
          source={require('../../../assets/images/islamic_pattern.png')}
          style={styles.patternImage}
          resizeMode="repeat"
          fadeDuration={0}
        />
      </View>

      {/* ── Fixed header (does NOT scroll) ── */}
      {header != null && (
        <View style={styles.fixedHeader}>
          {header}
        </View>
      )}

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <View>{children}</View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.045,        // very subtle — adds texture without noise
  },
  patternImage: {
    width: SW,
    height: SH,
  },
  fixedHeader: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
});

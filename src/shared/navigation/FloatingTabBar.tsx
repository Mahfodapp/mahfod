import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography } from '@/shared/theme';

const tabs = [
  { key: 'home', label: 'الرئيسية' },
  { key: 'library', label: 'المكتبة' },
  { key: 'review', label: 'المراجعة' },
  { key: 'settings', label: 'الإعدادات' },
];

interface Props {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

export function FloatingTabBar({ activeTab = 'home', onTabPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress?.(tab.key)}
              style={[styles.tab, active && styles.activeTab]}
            >
              <MText
                weight={active ? 'bold' : 'semi'}
                style={[styles.label, active && styles.activeLabel]}
              >
                {tab.label}
              </MText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface + 'F5',   // #121316 at 96% opacity
    borderRadius: 30,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 18,
  },
  tab: {
    flex: 1,
    height: 52,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  activeLabel: {
    color: colors.primary,
  },
});

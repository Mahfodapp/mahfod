import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Section } from '@/shared/ui/Section';
import { QuickActionButton } from './QuickActionButton';

export function QuickActionsSection() {
  return (
    <Section title="الوصول السريع" subtitle="ابدأ بسرعة من حيث تريد">
      <View style={styles.grid}>
        <QuickActionButton
          title="جلسة جديدة"
          subtitle="ابدأ مراجعة جديدة"
        />
        <QuickActionButton
          title="إضافة حفظ"
          subtitle="أضف مادة جديدة"
        />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 14,
  },
});

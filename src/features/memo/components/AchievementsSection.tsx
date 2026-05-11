import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Section } from '@/shared/ui/Section';
import { AchievementCard } from './AchievementCard';

export function AchievementsSection() {
  return (
    <Section
      title="الإنجازات"
      subtitle="إنجازاتك الأخيرة في الحفظ والمراجعة"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AchievementCard
          title="7 أيام متتالية"
          subtitle="حافظت على المراجعة اليومية"
        />
        <AchievementCard
          title="100 مراجعة"
          subtitle="أكملت 100 مراجعة بنجاح"
        />
        <AchievementCard
          title="ثبات ممتاز"
          subtitle="تجاوزت 90٪ معدل ثبات"
        />
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingRight: 20,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Section } from '@/shared/ui/Section';

const cells = Array.from({ length: 35 });

export function ActivityHeatmap() {
  return (
    <Section title="النشاط" subtitle="مستوى نشاطك خلال الأيام الماضية">
      <View style={styles.grid}>
        {cells.map((_, index) => {
          const active = index % 3 !== 0;
          return (
            <View
              key={index}
              style={[
                styles.cell,
                active && styles.activeCell,
              ]}
            />
          );
        })}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  activeCell: {
    backgroundColor: 'rgba(204,255,0,0.7)', // intentional — high-opacity fill, no token at this level
  },
});

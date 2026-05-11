import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Section } from '@/shared/ui/Section';
import { BookCard } from './BookCard';

const books = [
  { id: '1', title: 'صحيح البخاري', pages: 120, progress: 72 },
  { id: '2', title: 'رياض الصالحين', pages: 88, progress: 48 },
  { id: '3', title: 'الأربعون النووية', pages: 42, progress: 91 },
];

export function RecentBooksSection() {
  return (
    <Section title="مكتبتك" subtitle="آخر الكتب التي تعمل عليها">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {books.map(book => (
          <BookCard
            key={book.id}
            title={book.title}
            pages={book.pages}
            progress={book.progress}
          />
        ))}
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingRight: 20,
  },
});

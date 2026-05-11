/**
 * LibraryShelfRow — renders up to 4 BookSpines sitting on a real photographic
 * wooden shelf plank (assets/shelf.png).
 */
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { BookSpine, BOOK_W, BOOK_H } from './BookSpine';
import { Memo } from '@/types';

// Real wooden shelf photograph
const SHELF_IMG = require('../../../../assets/shelf_bg.png');

const { width: SW } = Dimensions.get('window');
// Shelf image fills full screen width; height is proportional (the source is ~8:1)
const SHELF_H = Math.round((SW / 8) * 1.1);

interface RowProps {
  memos: Memo[];
  onPress: (memo: Memo) => void;
  onLongPress: (memo: Memo) => void;
  rowIndex: number;
}

export function LibraryShelfRow({ memos, onPress, onLongPress, rowIndex }: RowProps) {
  // Always fill 4 slots — empty ones are invisible spacers
  const slots = [
    ...memos,
    ...Array(Math.max(0, 4 - memos.length)).fill(null),
  ];

  return (
    <View style={styles.rowWrapper}>

      {/* Books sitting just above the shelf surface */}
      <View style={styles.booksRow}>
        {slots.map((memo, i) =>
          memo ? (
            <BookSpine
              key={memo.id}
              memo={memo}
              onPress={onPress}
              onLongPress={onLongPress}
              index={rowIndex * 4 + i}
            />
          ) : (
            <View key={`empty-${rowIndex}-${i}`} style={styles.emptySlot} />
          ),
        )}
      </View>

      {/* Wooden shelf image */}
      <Image
        source={SHELF_IMG}
        style={[styles.shelfImage, { height: SHELF_H }]}
        resizeMode="stretch"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrapper: {
    marginBottom: 0,
  },
  booksRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    // books sit 2px above the shelf top surface
    marginBottom: -40,
    zIndex: 1,
  },
  emptySlot: {
    width: BOOK_W,
    height: BOOK_H,
  },
  shelfImage: {
    width: '100%',
    zIndex: 0,
  },
});

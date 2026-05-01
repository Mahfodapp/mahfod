import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Library, Plus, ChevronLeft, Book, Video, Bookmark } from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as noterService from '../services/noter.service';
import { NoterBook } from '../types';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function NoterHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [books, setBooks] = useState<NoterBook[]>([]);

  // Floating icon for empty state
  const floatAnim = useSharedValue(0);
  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const loadBooks = async () => {
    try {
      const data = await noterService.getBooks();
      setBooks(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isFocused) loadBooks();
  }, [isFocused]);

  const handleLongPress = (book: NoterBook) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('خيارات المصدر', book.title, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'فتح', onPress: () => navigation.navigate('NoterDetailScreen', { bookId: book.id }) },
      {
        text: 'حذف', style: 'destructive', onPress: async () => {
          try {
            await noterService.deleteBook(book.id);
            loadBooks();
          } catch {
            Alert.alert('خطأ', 'لم يتم الحذف');
          }
        }
      },
    ]);
  };

  const renderBook = ({ item, index }: { item: NoterBook; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('NoterDetailScreen', { bookId: item.id });
        }}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        {/* Accent left stripe */}
        <View style={[styles.stripe, { backgroundColor: item.type === 'video' ? '#8b5cf6' : colors.accent }]} />

        <View style={styles.cardTopRow}>
          <ChevronLeft color={colors.textMuted} size={20} />
          <View style={styles.cardCenter}>
            <Text style={styles.bookTitle}>{item.title}</Text>
            {!!item.author && <Text style={styles.bookAuthor}>{item.author}</Text>}
          </View>
          <View style={[styles.iconBox, { borderColor: item.type === 'video' ? 'rgba(139,92,246,0.3)' : 'rgba(204,255,0,0.25)' }]}>
            {item.type === 'video'
              ? <Video color="#8b5cf6" size={20} />
              : <Book color={colors.accent} size={20} />
            }
          </View>
        </View>
        <View style={styles.cardBottomRow}>
          <Text style={styles.dateText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : ''}
          </Text>
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectText}>{item.subject || 'عام'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const bookCount = books.filter(b => b.type === 'book').length;
  const videoCount = books.filter(b => b.type === 'video').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <Library color={colors.accent} size={24} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>المطالعات</Text>
          <Text style={styles.headerSubtitle}>الكتب والدروس المرئية</Text>
        </View>
      </Animated.View>

      {/* STATS CARD */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{videoCount}</Text>
          <Text style={styles.statLabel}>مرئيات</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{books.length}</Text>
          <Text style={styles.statLabel}>المجموع</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{bookCount}</Text>
          <Text style={styles.statLabel}>كتب</Text>
        </View>
      </Animated.View>

      {/* LIST */}
      <FlatList
        data={books}
        keyExtractor={item => item.id}
        renderItem={renderBook}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.springify()} style={styles.emptyState}>
            <Animated.View style={floatingStyle}>
              <Bookmark color={colors.accent} size={72} style={{ opacity: 0.7 }} />
            </Animated.View>
            <Text style={styles.emptyTitle}>لا توجد مصادر بعد</Text>
            <Text style={styles.emptySubtitle}>أضف كتاباً أو درساً مرئياً لتبدأ تدوين ملاحظاتك</Text>
          </Animated.View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabWrapper}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('AddNoterBookScreen');
        }}
        activeOpacity={0.85}
      >
        <View style={styles.fabGlow} />
        <View style={styles.fab}>
          <Plus color={colors.primary} size={28} />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },

  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, textAlign: 'right' },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginTop: 2 },

  statsCard: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.primaryLight,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },

  listContent: { paddingHorizontal: 20, paddingBottom: 120 },

  bookCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    paddingLeft: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCenter: { flex: 1, marginRight: 12 },
  bookTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', textAlign: 'right' },
  bookAuthor: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  dateText: { color: colors.textMuted, fontSize: 11 },
  subjectBadge: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(204,255,0,0.3)',
  },
  subjectText: { color: colors.accent, fontSize: 11, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { color: colors.textSecondary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  fabWrapper: { position: 'absolute', bottom: 32, left: 24 },
  fabGlow: {
    position: 'absolute',
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent,
    opacity: 0.25,
    transform: [{ scale: 1.5 }],
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
});

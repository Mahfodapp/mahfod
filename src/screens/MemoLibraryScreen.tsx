import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Dimensions, Alert, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useMemoStore } from '../store/memo.store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { LayoutGrid, BookOpen, ArrowRight, Search, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { StageBadge } from '../components/ui/StageBadge';
import { Memo } from '../types';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type FilterType = 'ALL' | 'LEARNING' | 'REVIEWING' | 'MASTERED';

export default function MemoLibraryScreen() {
  const { memos, deleteMemo, updateMemo } = useMemoStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [viewMode, setViewMode] = useState<'FACE' | 'SPINE'>('FACE');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatingIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }]
  }));

  const learningCount = memos.filter(m => m.stage === 'LEARNING').length;
  const reviewingCount = memos.filter(m => m.stage === 'REVIEWING').length;
  const masteredCount = memos.filter(m => m.stage === 'MASTERED').length;

  const filteredMemos = useMemo(() => {
    return memos.filter(m => {
      const matchesSearch = m.title.includes(searchQuery) || m.text.includes(searchQuery);
      const matchesFilter = activeFilter === 'ALL' || m.stage === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [memos, searchQuery, activeFilter]);

  const favoriteMemos = useMemo(() => filteredMemos.filter(m => m.is_favorite), [filteredMemos]);

  const handleLongPress = (memo: Memo) => {
    Alert.alert(
      'خيارات',
      memo.title,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تعديل', onPress: () => navigation.navigate('AddMemoScreen', { memoId: memo.id }) },
        { text: memo.is_favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة', onPress: () => updateMemo(memo.id, { is_favorite: !memo.is_favorite }) },
        { text: 'حذف', style: 'destructive', onPress: () => {
          Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المحفوظ؟', [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'حذف', style: 'destructive', onPress: () => deleteMemo(memo.id) }
          ]);
        }}
      ]
    );
  };

  const renderFaceBook = ({ item, index }: { item: Memo; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity 
        style={styles.faceCard}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#2d5a1b', '#3d7a25', '#4a8a2a']} style={styles.bookCoverGradient}>
          <View style={styles.goldBorder}>
            <TouchableOpacity 
              style={styles.starIcon} 
              onPress={() => updateMemo(item.id, { is_favorite: !item.is_favorite })}
            >
              <Star color={colors.accent} size={16} fill={item.is_favorite ? colors.accent : 'transparent'} />
            </TouchableOpacity>
            <Text style={styles.bookTitle} numberOfLines={3}>{item.title}</Text>
            <View style={styles.bookBottomStrip}>
              <StageBadge stage={item.stage} />
              <View style={styles.labelBadge}><Text style={styles.labelText}>{item.label || 'بدون'}</Text></View>
            </View>
          </View>
        </LinearGradient>
        <Text style={styles.timeText}>منذ قليل</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSpineBook = ({ item, index }: { item: Memo; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity 
        style={styles.spineCard}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#2d5a1b', '#3d7a25', '#4a8a2a']} style={styles.spineCoverGradient}>
          <View style={styles.spineGoldBorder}>
            <Text style={styles.spineTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.stageDot, { backgroundColor: item.stage === 'LEARNING' ? colors.stageLearning : item.stage === 'REVIEWING' ? colors.stageReview : colors.stageMastered }]} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderShelf = () => <View style={styles.shelf} />;

  if (memos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>مكتبتي</Text>
            <Text style={styles.headerSubtitle}>0 محفوظ</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowRight color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>
        <Animated.View entering={FadeInDown.springify()} style={styles.emptyContainer}>
          <Animated.View style={floatingIconStyle}>
            <BookOpen color={colors.accent} size={72} style={{ opacity: 0.8 }} />
          </Animated.View>
          <Text style={styles.emptyTitle}>مكتبتك فارغة</Text>
          <Text style={styles.emptySub}>ابدأ بإضافة أول محفوظاتك</Text>
          <Button variant="primary" label="+ إضافة محفوظ جديد" onPress={() => navigation.navigate('AddMemoScreen')} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.viewToggleBtn} onPress={() => setViewMode(prev => prev === 'FACE' ? 'SPINE' : 'FACE')}>
          {viewMode === 'FACE' ? <LayoutGrid color={colors.accent} size={20} /> : <BookOpen color={colors.accent} size={20} />}
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>مكتبتي</Text>
          <Text style={styles.headerSubtitle}>{memos.length} محفوظ</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowRight color={colors.textPrimary} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hintText}>
        {viewMode === 'FACE' ? 'عرض الأغلفة — اضغط مطولاً لخيارات' : 'رف الكتب — اضغط مطولاً لخيارات'}
      </Text>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Input 
          placeholder="ابحث في محفوظاتك..." 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
        />
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]} onPress={() => setActiveFilter('ALL')}>
            <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>الكل [{memos.length}]</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, activeFilter === 'LEARNING' && styles.filterChipActive]} onPress={() => setActiveFilter('LEARNING')}>
            <Text style={[styles.filterText, activeFilter === 'LEARNING' && styles.filterTextActive]}>يُحفظ [{learningCount}]</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, activeFilter === 'REVIEWING' && styles.filterChipActive]} onPress={() => setActiveFilter('REVIEWING')}>
            <Text style={[styles.filterText, activeFilter === 'REVIEWING' && styles.filterTextActive]}>مراجعة [{reviewingCount}]</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, activeFilter === 'MASTERED' && styles.filterChipActive]} onPress={() => setActiveFilter('MASTERED')}>
            <Text style={[styles.filterText, activeFilter === 'MASTERED' && styles.filterTextActive]}>محكم [{masteredCount}]</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {favoriteMemos.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.favHeader}>المفضلة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {favoriteMemos.map(m => (
              <View key={m.id} style={{ width: 80, height: 110 }}>
                {/* Simplified favorite cover */}
                <LinearGradient colors={['#2d5a1b', '#3d7a25', '#4a8a2a']} style={{ flex: 1, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', padding: 8, justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center' }} numberOfLines={3}>{m.title}</Text>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {viewMode === 'FACE' ? (
        <FlatList
          data={filteredMemos}
          key="FACE"
          numColumns={2}
          keyExtractor={item => item.id}
          renderItem={renderFaceBook}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ItemSeparatorComponent={renderShelf}
          ListFooterComponent={renderShelf}
        />
      ) : (
        <FlatList
          data={filteredMemos}
          key="SPINE"
          numColumns={4}
          keyExtractor={item => item.id}
          renderItem={renderSpineBook}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          columnWrapperStyle={{ justifyContent: 'flex-start', gap: 16 }}
          ItemSeparatorComponent={renderShelf}
          ListFooterComponent={renderShelf}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16,
  },
  viewToggleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: colors.textMuted },
  hintText: { color: colors.textMuted, fontSize: 12, textAlign: 'right', paddingHorizontal: 16, marginBottom: 12 },
  filterScroll: { flexDirection: 'row-reverse', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)' },
  filterChipActive: { backgroundColor: colors.accent },
  filterText: { color: colors.textSecondary, fontSize: 13 },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
  favHeader: { color: colors.accent, fontSize: 16, fontWeight: '700', textAlign: 'right', paddingHorizontal: 16, marginBottom: 8 },
  
  // Face View
  faceCard: { width: (width / 2) - 24, marginBottom: 8, alignItems: 'center' },
  bookCoverGradient: { width: '100%', aspectRatio: 0.7, borderRadius: 12, overflow: 'hidden' },
  goldBorder: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.4)', borderRadius: 10, margin: 2, padding: 8, justifyContent: 'center', alignItems: 'center' },
  starIcon: { position: 'absolute', top: 8, right: 8 },
  bookTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  bookBottomStrip: { position: 'absolute', bottom: 8, left: 8, right: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  labelBadge: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  labelText: { color: '#fff', fontSize: 10 },
  timeText: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  
  // Spine View
  spineCard: { width: (width / 4) - 16, marginBottom: 8 },
  spineCoverGradient: { width: '100%', aspectRatio: 0.35, borderRadius: 8, overflow: 'hidden' },
  spineGoldBorder: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.4)', borderRadius: 6, margin: 2, justifyContent: 'center', alignItems: 'center' },
  spineTitle: { color: '#FFFFFF', fontSize: 10, transform: [{ rotate: '-90deg' }], width: 100, textAlign: 'center' },
  stageDot: { position: 'absolute', bottom: 8, width: 8, height: 8, borderRadius: 4 },
  
  shelf: { height: 16, backgroundColor: 'rgba(101,67,33,0.6)', borderRadius: 2, marginVertical: 8 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, color: colors.textSecondary },
  emptySub: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { MapPin, X, Trash2, Edit2, RotateCcw, ChevronDown, ChevronUp, Share, Bookmark } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import * as noterService from '../services/noter.service';
import { NoterBook, NoterNote, NoteType } from '../types';
import Button from '../components/ui/Button';
import BottomSheet, { BottomSheetView, BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';

const NOTE_COLORS: Record<NoteType, string> = {
  'فكرة': colors.accent,
  'قلت': '#8b5cf6',
  'تلخيص': '#38bdf8',
  'أبيات': '#00EDB4',
  'تعقيب': '#FF7351',
};

const NOTE_TYPES: NoteType[] = ['تعقيب', 'أبيات', 'قلت', 'تلخيص', 'فكرة'];

export default function NoterDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'NoterDetailScreen'>>();
  const navigation = useNavigation();
  const { bookId } = route.params;

  const [book, setBook] = useState<NoterBook | null>(null);
  const [notes, setNotes] = useState<NoterNote[]>([]);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newNoteType, setNewNoteType] = useState<NoteType>('فكرة');
  const [newNoteText, setNewNoteText] = useState('');
  const [newPageRef, setNewPageRef] = useState('');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['10%', '55%'], []);

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

  const loadData = async () => {
    try {
      const books = await noterService.getBooks();
      const b = books.find(x => x.id === bookId);
      if (b) setBook(b);
      const n = await noterService.getNotes(bookId);
      setNotes(n);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [bookId]);

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      await noterService.addNote({
        book_id: bookId,
        text: newNoteText.trim(),
        note_type: newNoteType,
        page_ref: newPageRef.trim(),
        order_index: notes.length,
      });
      setNewNoteText('');
      setNewPageRef('');
      bottomSheetRef.current?.collapse();
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('حذف الملاحظة', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        await noterService.deleteNote(noteId);
        loadData();
      }}
    ]);
  };

  const adjustFontSize = (delta: number) => {
    setFontSizeScale(prev => Math.min(Math.max(prev + delta, 0.6), 1.6));
  };

  const renderNote = ({ item }: { item: NoterNote }) => {
    const noteColor = NOTE_COLORS[item.note_type] || colors.accent;
    return (
      <View style={[styles.noteCard, { borderLeftColor: noteColor }]}>
        <View style={styles.noteTopRow}>
          <View style={styles.noteActions}>
            <TouchableOpacity onPress={() => handleDeleteNote(item.id)}><Trash2 color={colors.textMuted} size={16} /></TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 12 }}><Edit2 color={colors.textMuted} size={16} /></TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 12 }}><RotateCcw color={colors.textMuted} size={16} /></TouchableOpacity>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
            <Text style={[styles.typeText, { color: noteColor }]}>{item.note_type}</Text>
          </View>
        </View>
        <Text style={[styles.noteText, { fontSize: 14 * fontSizeScale }]}>{item.text}</Text>
        {!!item.page_ref && <Text style={styles.pageRef}>ص {item.page_ref}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.mapBtn}>
            <MapPin color={colors.primary} size={16} />
            <Text style={styles.mapBtnText}>الخريطة</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{book?.title}</Text>
            {!!book?.author && <Text style={styles.headerSubtitle} numberOfLines={1}>{book.author}</Text>}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* TOOLBAR */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolBtn}><Text style={styles.toolBtnText}>كوفي</Text></TouchableOpacity>
          <View style={styles.fontControls}>
            <TouchableOpacity onPress={() => adjustFontSize(0.1)}><Text style={styles.toolBtnText}>+أ</Text></TouchableOpacity>
            <Text style={styles.fontScaleText}>{Math.round(fontSizeScale * 100)}%</Text>
            <TouchableOpacity onPress={() => adjustFontSize(-0.1)}><Text style={styles.toolBtnText}>-أ</Text></TouchableOpacity>
          </View>
          <TextInput 
            style={styles.searchInput}
            placeholder="بحث..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* MAIN CONTENT */}
        <FlatList
          data={notes.filter(n => n.text.includes(searchQuery))}
          keyExtractor={item => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Animated.View style={floatingIconStyle}>
                <Bookmark color={colors.accent} size={64} style={{ opacity: 0.8 }} />
              </Animated.View>
              <Text style={styles.emptyTitle}>لا توجد ملاحظات بعد</Text>
              <Text style={styles.emptySub}>اضغط على إضافة ملاحظة لتبدأ التدوين</Text>
            </View>
          }
        />
      </SafeAreaView>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: colors.primaryLight }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        keyboardBehavior="interactive"
      >
        <BottomSheetView style={styles.panelExpanded}>
          <View style={styles.panelHeaderRow}>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.collapse()}>
              <ChevronDown color={colors.textMuted} size={24} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: colors.textPrimary, marginRight: 8 }}>الفصل: بدون فصل</Text>
              <TouchableOpacity style={styles.smallBtn}><Text style={{ color: colors.accent, fontSize: 12 }}>+ فصل جديد</Text></TouchableOpacity>
            </View>
          </View>

          <BottomSheetScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {NOTE_TYPES.map(type => (
              <TouchableOpacity 
                key={type} 
                style={[styles.typeChip, newNoteType === type && styles.typeChipActive]}
                onPress={() => setNewNoteType(type)}
              >
                <Text style={[styles.typeChipText, newNoteType === type && styles.typeChipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </BottomSheetScrollView>

          <View style={styles.inputRow}>
            <BottomSheetTextInput 
              style={styles.pageInput} 
              placeholder="ص" 
              placeholderTextColor={colors.textMuted}
              value={newPageRef}
              onChangeText={setNewPageRef}
              keyboardType="numeric"
            />
            <BottomSheetTextInput 
              style={styles.mainInput} 
              placeholder="نص الملاحظة..." 
              placeholderTextColor={colors.textMuted}
              multiline
              value={newNoteText}
              onChangeText={setNewNoteText}
            />
          </View>

          <Button variant="primary" label="+ إضافة الملاحظة" onPress={handleAddNote} />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  mapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#BEEE00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  mapBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700', marginLeft: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: colors.textMuted },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  
  toolbar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border, gap: 12 },
  toolBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8 },
  toolBtnText: { color: colors.textPrimary, fontSize: 14 },
  fontControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 8 },
  fontScaleText: { color: colors.textMuted, fontSize: 12 },
  searchInput: { flex: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 12, color: colors.textPrimary, textAlign: 'right' },
  
  listContent: { padding: 16, gap: 12, paddingBottom: 150 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, color: colors.textSecondary },
  emptySub: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  
  noteCard: { backgroundColor: colors.primaryLight, borderRadius: 10, borderLeftWidth: 3, padding: 12 },
  noteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteActions: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 11, fontWeight: '600' },
  noteText: { color: colors.textPrimary, lineHeight: 22, textAlign: 'right' },
  pageRef: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 8 },
  
  panelExpanded: { padding: 16, paddingBottom: 32, gap: 16, flex: 1 },
  panelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4 },
  chipsScroll: { flexDirection: 'row-reverse', gap: 8, paddingBottom: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)' },
  typeChipActive: { backgroundColor: colors.accent },
  typeChipText: { color: colors.textSecondary, fontSize: 13 },
  typeChipTextActive: { color: colors.primary, fontWeight: '700' },
  
  inputRow: { flexDirection: 'row-reverse', gap: 12, alignItems: 'flex-start' },
  pageInput: { width: 60, height: 44, backgroundColor: colors.surfaceBright, borderRadius: 8, color: colors.textPrimary, textAlign: 'center' },
  mainInput: { flex: 1, minHeight: 80, backgroundColor: colors.surfaceBright, borderRadius: 8, padding: 12, color: colors.textPrimary, textAlign: 'right', textAlignVertical: 'top' },
});

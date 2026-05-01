import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { X } from 'lucide-react-native';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import * as noterService from '../services/noter.service';

export default function AddNoterBookScreen() {
  const navigation = useNavigation<any>();
  
  const [type, setType] = useState<'book' | 'video'>('book');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان المصدر');
      return;
    }
    setLoading(true);
    try {
      const book = await noterService.addBook({
        title, author, subject, type
      });
      navigation.replace('NoterDetailScreen', { bookId: book.id });
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={styles.headerTitle}>إضافة مصدر جديد</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <X color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* TYPE TOGGLE */}
          <View style={styles.segmentControl}>
            <TouchableOpacity 
              style={[styles.segmentBtn, type === 'video' && styles.segmentBtnActive]}
              onPress={() => setType('video')}
            >
              <Text style={[styles.segmentText, type === 'video' && styles.segmentTextActive]}>فيديو (مرئي)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, type === 'book' && styles.segmentBtnActive]}
              onPress={() => setType('book')}
            >
              <Text style={[styles.segmentText, type === 'book' && styles.segmentTextActive]}>كتاب</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          <Input 
            label="عنوان الكتاب / المصدر *" 
            placeholder="اكتب العنوان هنا..." 
            value={title} 
            onChangeText={setTitle} 
          />
          <View style={styles.spacer} />
          
          <Input 
            label="المؤلف (اختياري)" 
            placeholder="الاسم..." 
            value={author} 
            onChangeText={setAuthor} 
          />
          <View style={styles.spacer} />
          
          <Input 
            label="الموضوع (اختياري)" 
            placeholder="العقيدة، الفقه، السيرة..." 
            value={subject} 
            onChangeText={setSubject} 
          />
          
        </ScrollView>

        <View style={styles.stickyBottom}>
          <Button 
            variant="primary" 
            label="إضافة وتدوين الفوائد" 
            onPress={handleSave} 
            loading={loading} 
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  segmentControl: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: colors.primary, fontWeight: '700' },
  spacer: { height: 20 },
  stickyBottom: { padding: 16, backgroundColor: colors.primary, borderTopWidth: 0.5, borderTopColor: colors.border },
});

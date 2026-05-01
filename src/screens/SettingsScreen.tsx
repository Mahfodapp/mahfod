import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/auth.store';
import { useSettingsStore } from '../store/settings.store';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Cloud, Globe, Repeat, Bell, Plus, Database, LogOut, ChevronDown } from 'lucide-react-native';
import Button from '../components/ui/Button';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, isGuest, signOut } = useAuthStore();
  const { settings, update } = useSettingsStore();

  const [expandedCategories, setExpandedCategories] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleLogout = async () => {
    await signOut();
    navigation.replace('AuthScreen');
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    update({ [key]: value });
  };

  const addCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      updateSetting('categories', [...settings.categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    Alert.alert('حذف', `هل تريد حذف تصنيف "${cat}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => {
        updateSetting('categories', settings.categories.filter((c: string) => c !== cat));
      }}
    ]);
  };

  const renderSectionHeader = (icon: any, title: string, iconColor: string, delay: number) => (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {React.cloneElement(icon, { color: iconColor, size: 20 })}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }}>
          <ArrowRight color={colors.primary} size={20} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* SYNC */}
        {renderSectionHeader(<Cloud />, 'مزامنة', colors.accent, 100)}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.card}>
          {user && !isGuest ? (
            <View style={styles.rowReverseBetween}>
              <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
                <LogOut color={colors.error} size={20} />
              </TouchableOpacity>
              <Text style={styles.emailText}>{user.email}</Text>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.email?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.rowReverseCenter}>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Button variant="secondary" label="تسجيل الدخول" onPress={() => navigation.replace('AuthScreen')} />
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" label="إنشاء حساب" onPress={() => navigation.replace('AuthScreen')} />
              </View>
            </View>
          )}
        </Animated.View>

        {/* LANGUAGE */}
        {renderSectionHeader(<Globe />, 'اللغة', colors.accent, 200)}
        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.card}>
          <View style={styles.segmentControl}>
            {['Français', 'English', 'العربية'].map((lang, idx) => {
              const keys = ['fr', 'en', 'ar'];
              const isActive = settings.language === keys[idx];
              return (
                <TouchableOpacity 
                  key={lang} 
                  style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSetting('language', keys[idx]); }}
                >
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{lang}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* REPETITIONS */}
        {renderSectionHeader(<Repeat />, 'عدد التكرارات', colors.accent, 300)}
        <Animated.View entering={FadeInDown.delay(340).springify()} style={styles.card}>
          <View style={styles.rowReverseBetween}>
            <View>
              <Text style={styles.itemTitle}>الحفظ الأولي</Text>
              <Text style={styles.itemSub}>عدد التكرارات لأول مرة</Text>
            </View>
            <TouchableOpacity style={styles.numberPill}><Text style={styles.numberText}>{settings.initial_reps}</Text></TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowReverseBetween}>
            <View>
              <Text style={styles.itemTitle}>تكرار التقوية</Text>
              <Text style={styles.itemSub}>عند إعادة فتح محفوظ منتهو</Text>
            </View>
            <TouchableOpacity style={styles.numberPill}><Text style={styles.numberText}>{settings.reinforce_reps}</Text></TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowReverseBetween}>
            <View>
              <Text style={styles.itemTitle}>أيام المراجعة</Text>
              <Text style={styles.itemSub}>الأيام حتى يصبح محكماً</Text>
            </View>
            <TouchableOpacity style={styles.numberPill}><Text style={styles.numberText}>{settings.review_days}</Text></TouchableOpacity>
          </View>
        </Animated.View>

        {/* NOTIFICATIONS */}
        {renderSectionHeader(<Bell />, 'الإشعارات', '#FF9500', 400)}
        <Animated.View entering={FadeInDown.delay(440).springify()} style={styles.card}>
          <View style={styles.rowReverseBetween}>
            <Text style={styles.itemTitle}>مراجعة يومية</Text>
            <View style={styles.rowReverseCenter}>
              <TouchableOpacity style={styles.timePill}><Text style={styles.timeText}>{settings.daily_notif_time}</Text></TouchableOpacity>
              <Switch value={settings.daily_notif_enabled} onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSetting('daily_notif_enabled', v); }} trackColor={{ true: colors.accent }} style={{ marginLeft: 16 }} />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowReverseBetween}>
            <Text style={styles.itemTitle}>اختبار أسبوعي</Text>
            <View style={styles.rowReverseCenter}>
              <TouchableOpacity style={styles.timePill}><Text style={styles.timeText}>{settings.weekly_notif_time}</Text></TouchableOpacity>
              <Switch value={settings.weekly_notif_enabled} onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSetting('weekly_notif_enabled', v); }} trackColor={{ true: colors.accent }} style={{ marginLeft: 16 }} />
            </View>
          </View>
        </Animated.View>

        {/* CATEGORIES */}
        {renderSectionHeader(<Plus />, 'التصنيفات', '#FF2D55', 500)}
        <Animated.View entering={FadeInDown.delay(540).springify()}>
        <TouchableOpacity style={styles.card} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpandedCategories(!expandedCategories); }} activeOpacity={0.8}>
          <View style={styles.rowReverseBetween}>
            <Text style={styles.itemTitle}>التصنيفات ({settings.categories.length})</Text>
            <ChevronDown color={colors.textMuted} size={20} style={{ transform: [{ rotate: expandedCategories ? '180deg' : '0deg' }] }} />
          </View>
          {expandedCategories && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.chipContainer}>
                {settings.categories.map((cat: string) => (
                  <TouchableOpacity key={cat} style={styles.chip} onLongPress={() => removeCategory(cat)}>
                    <Text style={styles.chipText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.rowReverseCenter, { marginTop: 12 }]}>
                <TextInput 
                  style={styles.addCategoryInput} 
                  placeholder="تصنيف جديد..." 
                  placeholderTextColor={colors.textMuted}
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
                <TouchableOpacity style={styles.addCategoryBtn} onPress={addCategory}>
                  <Plus color={colors.primary} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
        </Animated.View>

        {/* DATA */}
        {renderSectionHeader(<Database />, 'البيانات', '#FF9500', 600)}
        <Animated.View entering={FadeInDown.delay(640).springify()} style={styles.card}>
          <TouchableOpacity style={styles.rowReverseBetween}>
            <Text style={styles.itemTitle}>تصدير البيانات</Text>
            <ArrowRight color={colors.textMuted} size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.rowReverseBetween}>
            <Text style={styles.itemTitle}>استيراد البيانات</Text>
            <ArrowRight color={colors.textMuted} size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.rowReverseBetween}>
            <Text style={[styles.itemTitle, { color: colors.error }]}>حذف البيانات</Text>
            <ArrowRight color={colors.textMuted} size={16} />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 60, gap: 16 },
  
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 8 },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  
  card: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: colors.border },
  rowReverseBetween: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  rowReverseCenter: { flexDirection: 'row-reverse', alignItems: 'center' },
  
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  avatarText: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  emailText: { color: colors.textPrimary, fontSize: 15, flex: 1, textAlign: 'right' },
  iconBtn: { padding: 8 },
  
  segmentControl: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: colors.primary, fontWeight: '700' },
  
  itemTitle: { color: colors.textPrimary, fontSize: 15, textAlign: 'right' },
  itemSub: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 12 },
  
  numberPill: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  numberText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  
  timePill: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timeText: { color: colors.textPrimary, fontSize: 14 },
  
  chipContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  addCategoryInput: { flex: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 12, color: colors.textPrimary, textAlign: 'right', marginRight: 8 },
  addCategoryBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
});

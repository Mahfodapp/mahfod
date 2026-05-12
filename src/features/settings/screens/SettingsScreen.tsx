/**
 * SettingsScreen — Premium RTL settings with card groups, icon badges, inline steppers.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Switch, TextInput, Keyboard, I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import { useSettingsStore } from '../store/settings.store';
import { useAuthStore } from '../../auth/store/auth.store';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { RevisionMode } from '@/types';
import {
  BookOpen, RefreshCw, Trophy, Bell, LogOut,
  User, Calendar, BrainCircuit, Repeat2,
  ListChecks, AlarmClock, Dumbbell, Info,
  ChevronLeft, Minus, Plus, Languages,
} from 'lucide-react-native';
import i18n from '@/shared/i18n';
import { MMKV } from 'react-native-mmkv';

const _storage = new MMKV();

// ─── Inline Stepper (self-contained, no external SettingsItem needed) ─────────

function Stepper({
  value, min = 1, max = 999, step = 1,
  onChange,
}: {
  value: number; min?: number; max?: number; step?: number;
  onChange: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const inputRef  = useRef<TextInput>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const valRef    = useRef(value);

  useEffect(() => {
    valRef.current = value;
  }, [value]);

  const stop = () => { if (repeatRef.current) { clearInterval(repeatRef.current); repeatRef.current = null; } };

  const go = (dir: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextVal = Math.min(max, Math.max(min, valRef.current + dir * step));
    valRef.current = nextVal;
    onChange(nextVal);
  };

  const startRepeat = (dir: 1 | -1) => {
    go(dir);
    repeatRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextVal = Math.min(max, Math.max(min, valRef.current + dir * step));
      valRef.current = nextVal;
      onChange(nextVal);
    }, 110);
  };

  const openEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n)) { onChange(Math.min(max, Math.max(min, n))); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    setEditing(false);
    Keyboard.dismiss();
  };

  return (
    <View style={st.row}>
      {/* row: − is on the RIGHT (leading in RTL), + on LEFT (trailing) */}
      <TouchableOpacity style={[st.btn, value <= min && st.btnDim]}
        onPress={() => go(-1)} onLongPress={() => startRepeat(-1)} onPressOut={stop}
        disabled={value <= min} delayLongPress={350} hitSlop={8}>
        <Minus size={13} color={value <= min ? colors.textMuted : colors.textPrimary} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity onPress={openEdit} style={st.valWrap} hitSlop={6}>
        {editing
          ? <TextInput ref={inputRef} style={st.input} value={draft} onChangeText={setDraft}
              keyboardType="number-pad" returnKeyType="done"
              onSubmitEditing={commit} onBlur={commit} selectTextOnFocus maxLength={4} />
          : <MText weight="bold" style={st.val}>{value}</MText>
        }
      </TouchableOpacity>

      <TouchableOpacity style={[st.btn, st.btnPlus, value >= max && st.btnDim]}
        onPress={() => go(1)} onLongPress={() => startRepeat(1)} onPressOut={stop}
        disabled={value >= max} delayLongPress={350} hitSlop={8}>
        <Plus size={13} color={value >= max ? colors.textMuted : colors.accent} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  btn:     { width: 32, height: 32, borderRadius: 99, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  btnPlus: { borderColor: colors.accentBorder },
  btnDim:  { opacity: 0.3 },
  valWrap: { minWidth: 48, height: 32, alignItems: 'center', justifyContent: 'center' },
  val:     { fontSize: 20, color: colors.accent },
  input:   { fontSize: 20, color: colors.accent, fontFamily: fonts.bold, textAlign: 'center', width: 48, height: 32, padding: 0, borderBottomWidth: 1.5, borderBottomColor: colors.accent },
});

// ─── Card ──────────────────────────────────────────────────────────────────────

function Card({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={cd.card}>
      {children}
    </Animated.View>
  );
}

const cd = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
});

// ─── Card header ───────────────────────────────────────────────────────────────

function CardHeader({ icon, label, color, badge }: {
  icon: React.ReactNode; label: string; color: string; badge?: string;
}) {
  return (
    <View style={[ch.row, { borderBottomColor: color + '25' }]}>
      <View style={[ch.iconBadge, { backgroundColor: color + '18' }]}>{icon}</View>
      <MText weight="bold" style={[ch.label, { color }]}>{label}</MText>
      {badge && <View style={[ch.pill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
        <MText weight="semi" style={[ch.pillText, { color }]}>{badge}</MText>
      </View>}
    </View>
  );
}

const ch = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14, borderBottomWidth: 1, gap: spacing.sm },
  iconBadge:{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:    { ...typography.label, letterSpacing: 0.5, flex: 1, textAlign: 'left' },
  pill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  pillText: { ...typography.caption, fontFamily: fonts.semi },
});

// ─── Card row ──────────────────────────────────────────────────────────────────

function CardRow({ icon, iconColor, title, subtitle, last = false, children }: {
  icon: React.ReactNode; iconColor: string; title: string;
  subtitle?: string; last?: boolean; children: React.ReactNode;
}) {
  return (
    <View style={[cr.row, !last && cr.divider]}>
      {/* icon badge */}
      <View style={[cr.iconBadge, { backgroundColor: iconColor + '15' }]}>{icon}</View>
      {/* text block */}
      <View style={cr.texts}>
        <MText weight="semi" style={cr.title}>{title}</MText>
        {subtitle && <MText weight="regular" style={cr.sub}>{subtitle}</MText>}
      </View>
      {/* control */}
      <View style={cr.control}>{children}</View>
    </View>
  );
}

const cr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm, minHeight: 68 },
  divider:  { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  iconBadge:{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  texts:    { flex: 1, gap: 2, alignItems: 'flex-end' },
  title:    { ...typography.bodySmall, color: colors.textPrimary, textAlign: 'left' },
  sub:      { ...typography.caption, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'left', lineHeight: 16 },
  control:  { flexShrink: 0 },
});

// ─── Language picker ──────────────────────────────────────────────────────────

const LANGS = [
  { code: 'ar', label: 'العربية', abbr: 'AR', rtl: true  },
  { code: 'en', label: 'English',  abbr: 'EN', rtl: false },
  { code: 'fr', label: 'Français', abbr: 'FR', rtl: false },
] as const;

type LangCode = typeof LANGS[number]['code'];

function LanguagePicker({ value, onChange }: { value: LangCode; onChange: (code: LangCode) => void }) {
  return (
    <View style={lp.track}>
      {LANGS.map(lang => {
        const active = value === lang.code;
        return (
          <TouchableOpacity
            key={lang.code}
            style={[lp.opt, active && lp.optActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onChange(lang.code); }}
            activeOpacity={0.8}
          >
            <MText weight="extra" style={[lp.abbr, active && lp.abbrActive]}>{lang.abbr}</MText>
            <MText weight="semi"  style={[lp.label, active && lp.labelActive]}>{lang.label}</MText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const lp = StyleSheet.create({
  track:      { flexDirection: 'row', margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 3, gap: 3, overflow: 'hidden' },
  opt:        { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', gap: 2 },
  optActive:  { backgroundColor: colors.accent },
  abbr:       { ...typography.label, color: colors.accent, letterSpacing: 1.5 },
  abbrActive: { color: colors.primary },
  label:      { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  labelActive:{ color: colors.primary, opacity: 0.85 },
});

// ─── Segmented mode picker ─────────────────────────────────────────────────────

function ModePicker({ value, onChange }: { value: RevisionMode; onChange: (m: RevisionMode) => void }) {
  return (
    <View style={mp.track}>
      {([
        { key: 'fixed', icon: <Calendar size={15} />, label: 'ثابت',    sub: 'وتيرة يومية' },
        { key: 'sm2',   icon: <BrainCircuit size={15} />, label: 'ذكي SM-2', sub: 'خوارزمية علمية' },
      ] as const).map(opt => {
        const active = value === opt.key;
        const ac = colors.accent;   // lime only — no teal/blue
        return (
          <TouchableOpacity
            key={opt.key}
            style={[mp.opt, active && { backgroundColor: ac }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onChange(opt.key); }}
            activeOpacity={0.8}
          >
            {React.cloneElement(opt.icon, { color: active ? colors.primary : colors.textMuted, strokeWidth: 1.8 })}
            <MText weight="bold" style={[mp.label, active && { color: colors.primary }]}>{opt.label}</MText>
            <MText weight="regular" style={[mp.sub, active && { color: colors.primary, opacity: 0.8 }]}>{opt.sub}</MText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const mp = StyleSheet.create({
  track: { flexDirection: 'row', margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 3, gap: 3, overflow: 'hidden' },
  opt:   { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', gap: 3 },
  label: { ...typography.label, color: colors.textMuted, textAlign: 'center' },
  sub:   { ...typography.caption, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center' },
});

// ─── SM-2 info ─────────────────────────────────────────────────────────────────

function Sm2Info() {
  return (
    <View style={si.card}>
      <Info size={14} color={colors.accent} style={{ marginTop: 1 }} />
      <MText weight="regular" style={si.text}>
        بعد كل قراءة تختار: 🔴 نسيت · 🟠 صعب · 🟡 حسناً · 🟢 سهل.{' '}
        النظام يحسب الموعد التالي تلقائياً حسب مستوى تذكرك.
      </MText>
    </View>
  );
}

const si = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.accentSoft, borderRadius: radius.md, borderWidth: 1, borderColor: colors.accentBorder },
  text: { flex: 1, ...typography.caption, color: colors.accent, textAlign: 'left', lineHeight: 19 },
});

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { settings, update, load } = useSettingsStore();
  const { user, isGuest, signOut }  = useAuthStore();

  useEffect(() => { load(user?.id); }, [user?.id]);

  const currentLang = (settings.language ?? i18n.language ?? 'ar') as LangCode;

  const handleLanguageChange = useCallback((code: LangCode) => {
    const lang = LANGS.find(l => l.code === code);
    if (!lang || code === currentLang) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 1. Switch i18next immediately (text updates live)
    i18n.changeLanguage(code);

    // 2. Save to settings store + MMKV
    update({ language: code });
    const raw = _storage.getString('mahfod_settings');
    const saved = raw ? JSON.parse(raw) : {};
    _storage.set('mahfod_settings', JSON.stringify({ ...saved, language: code }));

    // 3. Update I18nManager (takes effect after restart)
    I18nManager.allowRTL(lang.rtl);
    I18nManager.forceRTL(lang.rtl);

    // 4. Inform user restart is needed for layout direction change
    Alert.alert(
      code === 'ar' ? 'تم تغيير اللغة' : (code === 'fr' ? 'Langue changée' : 'Language Changed'),
      code === 'ar'
        ? 'أعد تشغيل التطبيق لتطبيق اتجاه التخطيط بشكل كامل.'
        : (code === 'fr' ? 'Redémarrez l\'application pour appliquer le nouveau sens de lecture.' : 'Restart the app to fully apply the new layout direction.'),
      [{ text: code === 'ar' ? 'حسناً' : 'OK', style: 'default' }],
    );
  }, [currentLang, update]);

  const handleSignOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive',
        onPress: async () => { try { await signOut(); } catch (e) { console.error(e); } } },
    ]);
  }, [signOut]);

  const mode = settings.revision_mode ?? 'fixed';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <MahfodPatternBackground />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <MotiView from={{ opacity: 0, translateY: -12 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18 }} style={s.pageHeader}>
          <MText weight="extra" style={s.pageTitle}>الإعدادات</MText>
          <MText weight="regular" style={s.pageSub}>تخصيص تجربة الحفظ والمراجعة</MText>
        </MotiView>

        {/* ══ اللغة ════════════════════════════════════════════════════ */}
        <Card delay={20}>
          <CardHeader
            icon={<Languages size={16} color={colors.accent} />}
            label={currentLang === 'ar' ? 'اللغة' : (currentLang === 'fr' ? 'Langue' : 'Language')}
            color={colors.accent}
          />
          <View style={{ paddingBottom: spacing.sm }}>
            <LanguagePicker value={currentLang} onChange={handleLanguageChange} />
          </View>
        </Card>

        {/* ══ الحساب ════════════════════════════════════════════════════ */}
        <Card delay={40}>
          <CardHeader icon={<User size={16} color={colors.textSecondary} />} label={currentLang === 'ar' ? 'الحساب' : (currentLang === 'fr' ? 'Compte' : 'Account')} color={colors.textSecondary} />
          <CardRow
            icon={<User size={16} color={colors.textSecondary} />}
            iconColor={colors.textSecondary}
            title={isGuest ? (currentLang === 'ar' ? 'زائر' : 'Guest') : (user?.email || (currentLang === 'ar' ? 'غير معروف' : 'Unknown'))}
            subtitle={isGuest ? (currentLang === 'ar' ? 'لم يتم تسجيل الدخول' : 'Not signed in') : (currentLang === 'ar' ? 'حسابك المرتبط' : 'Your linked account')}
            last
          >
            <ChevronLeft size={16} color={colors.textMuted} />
          </CardRow>
        </Card>

        {/* ══ مرحلة الحفظ ════════════════════════════════════════════════ */}
        <Card delay={100}>
          <CardHeader
            icon={<BookOpen size={16} color={colors.stageLearning} />}
            label="مرحلة الحفظ"
            color={colors.stageLearning}
            badge="يُحفظ"
          />
          <CardRow
            icon={<Repeat2 size={16} color={colors.stageLearning} />}
            iconColor={colors.stageLearning}
            title="تكرارات الحفظ"
            subtitle="المرات اللازمة لحفظ المذكرة قبل الانتقال للمراجعة"
            last
          >
            <Stepper value={settings.initial_reps} min={5} max={100} onChange={v => update({ initial_reps: v })} />
          </CardRow>
        </Card>

        {/* ══ مرحلة المراجعة ══════════════════════════════════════════════ */}
        <Card delay={160}>
          <CardHeader
            icon={<RefreshCw size={16} color={colors.stageReview} />}
            label="مرحلة المراجعة"
            color={colors.stageReview}
            badge="مراجعة"
          />

          {/* Mode picker */}
          <ModePicker value={mode} onChange={m => update({ revision_mode: m })} />

          {/* SM-2 info */}
          {mode === 'sm2' && <Sm2Info />}

          {/* Fixed-only params */}
          {mode === 'fixed' && <>
            <CardRow
              icon={<Calendar size={16} color={colors.stageReview} />}
              iconColor={colors.stageReview}
              title="إجمالي أيام المراجعة"
              subtitle="عدد الجلسات حتى الانتقال لمرحلة المحكم"
            >
              <Stepper value={settings.revision_reps ?? 30} min={5} max={120} onChange={v => update({ revision_reps: v })} />
            </CardRow>
            <CardRow
              icon={<Repeat2 size={16} color={colors.stageReview} />}
              iconColor={colors.stageReview}
              title="تكرار الجلسة الواحدة"
              subtitle="كم مرة تضغط «كررت» لكل محفوظ في الجلسة"
            >
              <Stepper value={settings.session_reps ?? 5} min={1} max={20} onChange={v => update({ session_reps: v })} />
            </CardRow>
          </>}

          <CardRow
            icon={<ListChecks size={16} color={colors.stageReview} />}
            iconColor={colors.stageReview}
            title="محفوظات الجلسة اليومية"
            subtitle="الحد الأقصى لعدد المحفوظات في كل جلسة"
            last
          >
            <Stepper value={settings.daily_review_count} min={1} max={50} onChange={v => update({ daily_review_count: v })} />
          </CardRow>
        </Card>

        {/* ══ مرحلة المحكم ════════════════════════════════════════════════ */}
        <Card delay={220}>
          <CardHeader
            icon={<Trophy size={16} color={colors.stageMastered} />}
            label="مرحلة المحكم"
            color={colors.stageMastered}
            badge="محكم"
          />
          <CardRow
            icon={<Dumbbell size={16} color={colors.stageMastered} />}
            iconColor={colors.stageMastered}
            title="تكرارات التعزيز"
            subtitle="مرات التثبيت قبل اعتبار المحفوظ محكماً بالكامل"
            last
          >
            <Stepper value={settings.reinforce_reps} min={1} max={30} onChange={v => update({ reinforce_reps: v })} />
          </CardRow>
        </Card>

        {/* ══ الإشعارات ═══════════════════════════════════════════════════ */}
        <Card delay={280}>
          <CardHeader
            icon={<Bell size={16} color={colors.textSecondary} />}
            label="الإشعارات"
            color={colors.textSecondary}
          />
          <CardRow
            icon={<AlarmClock size={16} color={colors.textSecondary} />}
            iconColor={colors.textSecondary}
            title="تذكير المراجعة اليومية"
            subtitle={`الساعة ${settings.daily_notif_time}`}
          >
            <Switch
              value={settings.daily_notif_enabled}
              onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update({ daily_notif_enabled: v }); }}
              trackColor={{ true: colors.accent, false: colors.surfaceBright }}
            />
          </CardRow>
          <CardRow
            icon={<Bell size={16} color={colors.textSecondary} />}
            iconColor={colors.textSecondary}
            title="الاختبار الأسبوعي"
            subtitle={`الساعة ${settings.weekly_notif_time}`}
            last
          >
            <Switch
              value={settings.weekly_notif_enabled}
              onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update({ weekly_notif_enabled: v }); }}
              trackColor={{ true: colors.accent, false: colors.surfaceBright }}
            />
          </CardRow>
        </Card>

        {/* ══ عن التطبيق ══════════════════════════════════════════════════ */}
        <Card delay={340}>
          <CardHeader
            icon={<Info size={16} color={colors.textMuted} />}
            label="عن التطبيق"
            color={colors.textMuted}
          />
          <CardRow
            icon={<Info size={16} color={colors.textMuted} />}
            iconColor={colors.textMuted}
            title="الإصدار"
            last
          >
            <MText weight="semi" style={s.versionText}>1.0.0</MText>
          </CardRow>
        </Card>

        {/* ══ تسجيل الخروج ════════════════════════════════════════════════ */}
        {!isGuest && (
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
              <LogOut size={18} color={colors.error} strokeWidth={1.8} />
              <MText weight="bold" style={s.signOutText}>تسجيل الخروج</MText>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.primary },
  scroll:      { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 100 },
  pageHeader:  { alignItems: 'flex-end', marginBottom: spacing.xl, marginTop: spacing.sm },
  pageTitle:   { fontSize: 34, color: colors.textPrimary, textAlign: 'left', fontFamily: fonts.extra },
  pageSub:     { ...typography.bodySmall, color: colors.textMuted, marginTop: 4, textAlign: 'left' },
  versionText: { ...typography.bodySmall, color: colors.textMuted },
  signOutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.error + '35', backgroundColor: colors.errorSoft, marginTop: spacing.sm },
  signOutText: { ...typography.body, color: colors.error },
});

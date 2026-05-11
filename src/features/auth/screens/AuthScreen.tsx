/**
 * AuthScreen — Login / Sign-up / Guest entry.
 *
 * Rules: <MText> only, colors.* tokens, fonts.* typography, RTL-first.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MText } from '@/shared/ui/MText';
import { MahfodPatternBackground } from '@/shared/ui/MahfodPatternBackground';
import Input from '@/shared/ui/Input';
import { colors, spacing, radius, typography, fonts, Shadows } from '@/shared/theme';
import { useAuthStore } from '../store/auth.store';
import { LogIn, UserPlus, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp, setGuest, isLoading } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const toggleMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(m => (m === 'login' ? 'signup' : 'login'));
    setError('');
  }, []);

  const handleAuth = useCallback(async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد وكلمة المرور');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('يرجى إدخال الاسم');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ غير متوقع');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [mode, email, password, name, signIn, signUp]);

  const handleGuest = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGuest();
  }, [setGuest]);

  return (
    <SafeAreaView style={styles.safe}>
      <MahfodPatternBackground />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Branding ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.brandSection}>
            <MText weight="extra" style={styles.brandName}>محفوظ</MText>
            <MText weight="bold" style={styles.tagline}>
              رحلة حفظ أكثر هدوءًا{'\n'}وتركيزًا
            </MText>
            <MText weight="regular" style={styles.description}>
              نظام ذكي لمساعدتك على تثبيت الحفظ{'\n'}والمراجعة بطريقة عميقة ومستقرة.
            </MText>
          </Animated.View>

          {/* ── Form ── */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.formCard}>
            <MText weight="bold" style={styles.formTitle}>
              {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </MText>

            {mode === 'signup' && (
              <Input
                label="الاسم"
                placeholder="أدخل اسمك"
                value={name}
                onChangeText={setName}
              />
            )}

            <Input
              label="البريد الإلكتروني"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="كلمة المرور"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? (
              <View style={styles.errorBox}>
                <MText weight="semi" style={styles.errorText}>{error}</MText>
              </View>
            ) : null}

            {/* Primary auth button */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleAuth}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  {mode === 'login' ? (
                    <LogIn size={18} color={colors.primary} />
                  ) : (
                    <UserPlus size={18} color={colors.primary} />
                  )}
                  <MText weight="bold" style={styles.primaryBtnText}>
                    {mode === 'login' ? 'دخول' : 'إنشاء حساب'}
                  </MText>
                </>
              )}
            </TouchableOpacity>

            {/* Toggle mode */}
            <TouchableOpacity onPress={toggleMode} style={styles.toggleBtn}>
              <MText weight="regular" style={styles.toggleText}>
                {mode === 'login'
                  ? 'ليس لديك حساب؟ أنشئ واحداً'
                  : 'لديك حساب بالفعل؟ سجّل الدخول'}
              </MText>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Guest mode ── */}
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
              <User size={18} color={colors.textSecondary} />
              <MText weight="semi" style={styles.guestText}>الدخول كزائر</MText>
            </TouchableOpacity>
          </Animated.View>

          <MText weight="regular" style={styles.footer}>
            بالمتابعة فإنك توافق على الشروط والأحكام
          </MText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },

  // Branding
  brandSection: {
    marginBottom: spacing.xl,
  },
  brandName: {
    ...typography.display,
    color: colors.accent,
    textAlign: 'left',
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 36,
    lineHeight: 52,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'left',
    marginTop: spacing.md,
  },

  // Form card
  formCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...Shadows.card,
  },
  formTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'left',
    marginBottom: spacing.xs,
  },

  // Error
  errorBox: {
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,115,81,0.25)',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'left',
  },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...Shadows.glow,
    elevation: 8,
  },
  primaryBtnText: {
    ...typography.h3,
    color: colors.primary,
  },

  // Toggle
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  toggleText: {
    ...typography.bodySmall,
    color: colors.accent,
  },

  // Guest
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  guestText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

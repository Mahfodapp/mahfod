import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/auth.store';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { signIn, signUp, setGuest, isLoading } = useAuthStore();

  const handleAuth = async () => {
    setErrorMsg('');
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* TOP SECTION */}
        <View style={styles.topSection}>
          <Text style={styles.logoText}>محفوظ</Text>
          <Text style={styles.logoSubtext}>مكتبة المحفوظات</Text>
        </View>

        {/* MIDDLE SECTION */}
        <View style={styles.middleSection}>
          <Text style={styles.headline}>المزامنة السحابية</Text>
          <Text style={styles.subtext}>
            أنشئ حساباً مجانياً للحفاظ على محفوظاتك آمنة ومزامنتها في جميع أجهزتك.
          </Text>

          {!isLogin && (
            <Input
              label="الاسم"
              placeholder="اسمك الكريم"
              value={name}
              onChangeText={setName}
            />
          )}

          <Input
            label="البريد الإلكتروني"
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="كلمة المرور"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errorMsg}
          />

          <View style={styles.spacer} />

          <Button 
            variant="primary"
            label={isLogin ? 'تسجيل الدخول ←' : 'إنشاء الحساب ←'}
            onPress={handleAuth}
            loading={isLoading}
          />

          <Text style={styles.toggleText} onPress={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
            {isLogin ? 'لا تملك حساباً؟ أنشئ حساباً جديداً' : 'تملك حساباً؟ سجّل الدخول'}
          </Text>
        </View>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>
          <Text style={styles.guestText} onPress={setGuest}>
            تخطى كزائر (بدون مزامنة) ←
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  topSection: {
    flex: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.accent,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontFamily: 'Cairo_800ExtraBold',
  },
  logoSubtext: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
    fontFamily: 'Cairo_400Regular',
  },
  middleSection: {
    flex: 6,
    gap: 16,
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    fontFamily: 'Cairo_700Bold',
  },
  subtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'Cairo_400Regular',
    lineHeight: 22,
  },
  spacer: {
    height: 8,
  },
  toggleText: {
    color: colors.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 16,
    fontFamily: 'Cairo_400Regular',
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  guestText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Cairo_400Regular',
  },
});

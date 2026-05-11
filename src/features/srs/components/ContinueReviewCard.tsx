import React from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { MText } from '@/shared/ui/MText';
import { Card } from '@/shared/ui/Card';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';
import { colors, spacing, typography } from '@/shared/theme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ContinueReviewCard() {
  const navigation = useNavigation<NavProp>();

  return (
    <Card style={styles.card}>
      <MText weight="bold" style={styles.title}>جلسة المراجعة</MText>
      <MText weight="regular" style={styles.subtitle}>
        راجع محفوظاتك المستحقة اليوم وعزّز الثبات
      </MText>
      <PrimaryButton
        title="ابدأ المراجعة"
        onPress={() => navigation.navigate('ReviewSessionScreen')}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm + 2 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg },
});

import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography, Shadows } from '@/shared/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FocusModeOverlay({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <MText weight="bold" style={styles.title}>وضع التركيز</MText>
          <MText weight="regular" style={styles.description}>
            تم إخفاء جميع العناصر المشتتة لمساعدتك
            على التركيز الكامل أثناء المراجعة.
          </MText>
          <Pressable onPress={onClose} style={styles.button}>
            <MText weight="bold" style={styles.buttonText}>متابعة</MText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: colors.overlay,
    justifyContent: 'center', paddingHorizontal: spacing.lg,
  },
  card: {
    borderRadius: radius.xl + 4, padding: spacing.xl + 4,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1, borderColor: colors.border,
    ...Shadows.card,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  description: {
    ...typography.bodySmall, color: colors.textSecondary,
    lineHeight: 28, marginTop: spacing.md, marginBottom: spacing.lg,
    fontSize: 15,
  },
  button: {
    height: 56, borderRadius: radius.xl,
    backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  buttonText: { ...typography.bodySmall, color: colors.primary },
});

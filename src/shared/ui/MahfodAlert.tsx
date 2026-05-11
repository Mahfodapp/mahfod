import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useAlertStore } from '../store/alert.store';
import { colors, spacing, radius } from '../theme';
import { MText } from './MText';

export function MahfodAlert() {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();
  const [show, setShow] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start(() => setShow(false));
    }
  }, [visible]);

  if (!show) return null;

  return (
    <Modal transparent visible={show} onRequestClose={hideAlert} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>
          <MText weight="bold" style={styles.title}>{title}</MText>
          {!!message && (
            <MText weight="regular" style={styles.message}>{message}</MText>
          )}
          <View style={styles.buttonsContainer}>
            {buttons.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={[
                    styles.button,
                    isDestructive && styles.destructiveButton,
                    isCancel && styles.cancelButton,
                  ]}
                  onPress={() => {
                    hideAlert();
                    setTimeout(() => {
                      if (btn.onPress) btn.onPress();
                    }, 200);
                  }}
                >
                  <MText
                    weight="semi"
                    style={[
                      styles.buttonText,
                      isDestructive && { color: colors.error },
                      isCancel && { color: colors.textSecondary },
                    ]}
                  >
                    {btn.text}
                  </MText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.borderStrong || 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  destructiveButton: {
    backgroundColor: 'rgba(255,115,81,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,115,81,0.3)',
  },
  buttonText: {
    color: colors.primary,
    fontSize: 15,
  },
});

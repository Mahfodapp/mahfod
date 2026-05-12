import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { useAlertStore } from '../store/alert.store';
import { colors, spacing, radius } from '../theme';
import { MText } from './MText';

export function MahfodAlert() {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();
  const [show, setShow] = useState(visible);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      setShow(true);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 }, (finished) => {
        if (finished) runOnJS(setShow)(false);
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!show) return null;

  return (
    <Modal transparent visible={show} onRequestClose={hideAlert} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
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
    flexDirection: 'column',
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    width: '100%',
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

import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Switch,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import { MText } from '@/shared/ui/MText';
import { colors, spacing, radius, typography, fonts } from '@/shared/theme';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  /** Renders a Switch */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  danger?: boolean;
  /**
   * Stepper mode — inline − / number / + controls.
   * Tapping the number opens an inline TextInput for direct entry.
   * Long-pressing − or + repeats every 120 ms.
   */
  stepperValue?: number;
  stepperMin?: number;
  stepperMax?: number;
  stepperStep?: number;
  onStepperChange?: (next: number) => void;
}

export function SettingsItem({
  title,
  subtitle,
  value,
  onPress,
  switchValue,
  onSwitchChange,
  danger = false,
  stepperValue,
  stepperMin = 1,
  stepperMax = 999,
  stepperStep = 1,
  onStepperChange,
}: Props) {
  const hasSwitch  = switchValue  !== undefined;
  const hasStepper = stepperValue !== undefined && onStepperChange !== undefined;

  // ── Inline editing state ──────────────────────────────────────────────────
  const [editing,    setEditing]    = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  const openEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputValue(String(stepperValue ?? ''));
    setEditing(true);
    // Focus on next tick after state update
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const commitEdit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(stepperMax, Math.max(stepperMin, parsed));
      onStepperChange?.(clamped);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditing(false);
    Keyboard.dismiss();
  };

  const cancelEdit = () => {
    setEditing(false);
    Keyboard.dismiss();
  };

  // ── Long-press repeat ─────────────────────────────────────────────────────
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeat = () => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  };

  const startRepeat = (direction: 1 | -1) => {
    const fire = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onStepperChange?.(
        Math.min(stepperMax, Math.max(stepperMin,
          (stepperValue ?? 0) + direction * stepperStep
        ))
      );
    };
    fire();
    repeatRef.current = setInterval(fire, 120);
  };

  const decrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStepperChange?.(Math.max(stepperMin, (stepperValue ?? 0) - stepperStep));
  };

  const increment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStepperChange?.(Math.min(stepperMax, (stepperValue ?? 0) + stepperStep));
  };

  const atMin = (stepperValue ?? 0) <= stepperMin;
  const atMax = (stepperValue ?? 0) >= stepperMax;

  return (
    <Pressable
      onPress={() => {
        if (hasSwitch || hasStepper) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.container,
        pressed && !hasSwitch && !hasStepper && styles.pressed,
      ]}
    >
      {/* ── Label block ── */}
      <View style={styles.textSection}>
        <MText weight="semi" style={[styles.title, danger && { color: colors.error }]}>
          {title}
        </MText>
        {subtitle ? (
          <MText weight="regular" style={styles.subtitle}>{subtitle}</MText>
        ) : null}
      </View>

      {/* ── Switch ── */}
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSwitchChange?.(v);
          }}
          trackColor={{ true: colors.accent, false: colors.surfaceBright }}
        />
      )}

      {/* ── Stepper ── */}
      {!hasSwitch && hasStepper && (
        <View style={styles.stepper}>

          {/* − button */}
          <TouchableOpacity
            style={[styles.stepBtn, atMin && styles.stepBtnDisabled]}
            onPress={decrement}
            onLongPress={() => startRepeat(-1)}
            onPressOut={stopRepeat}
            disabled={atMin}
            delayLongPress={350}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Minus size={14} color={atMin ? colors.textMuted : colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Number — tapping opens inline TextInput */}
          <TouchableOpacity
            onPress={openEdit}
            style={styles.stepValue}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            {editing ? (
              <TextInput
                ref={inputRef}
                style={styles.stepInput}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={commitEdit}
                onBlur={commitEdit}
                selectTextOnFocus
                maxLength={4}
              />
            ) : (
              <MText weight="bold" style={styles.stepValueText}>
                {stepperValue}
              </MText>
            )}
          </TouchableOpacity>

          {/* + button */}
          <TouchableOpacity
            style={[styles.stepBtn, styles.stepBtnPlus, atMax && styles.stepBtnDisabled]}
            onPress={increment}
            onLongPress={() => startRepeat(1)}
            onPressOut={stopRepeat}
            disabled={atMax}
            delayLongPress={350}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Plus size={14} color={atMax ? colors.textMuted : colors.accent} strokeWidth={2.5} />
          </TouchableOpacity>

        </View>
      )}

      {/* ── Plain value + chevron ── */}
      {!hasSwitch && !hasStepper && value && (
        <View style={styles.valueRow}>
          <MText weight="regular" style={styles.valueText}>{value}</MText>
          <ChevronLeft size={16} color={colors.textMuted} />
        </View>
      )}

      {/* ── Bare chevron ── */}
      {!hasSwitch && !hasStepper && !value && (
        <ChevronLeft size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    minHeight: 74,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  containerFlat: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    marginBottom: 0,
    flex: 1,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  textSection: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'left',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  valueText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },

  // ── Stepper ───────────────────────────────────────────────────────────────
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: spacing.sm,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPlus: {
    borderColor: colors.accentBorder,
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  stepValue: {
    minWidth: 52,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepValueText: {
    fontSize: 20,
    color: colors.accent,
  },
  stepInput: {
    fontSize: 20,
    color: colors.accent,
    fontFamily: fonts.bold,
    textAlign: 'center',
    width: 52,
    height: 36,
    padding: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accent,
    backgroundColor: 'transparent',
  },
});

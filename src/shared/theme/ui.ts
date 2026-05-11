import { colors } from './colors';

/** Shared radii — RTL-first Mahfod UI */
export const radii = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

/** Frosted / glass panel (recovery spec) */
export const glassPanel = {
  backgroundColor: colors.glassCard,
  borderWidth: 1 as const,
  borderColor: colors.glassBorder,
  borderRadius: radii.lg,
};

/** Text fields & tappable tiles */
export const surfaceField = {
  backgroundColor: colors.surfaceAlt,
  borderWidth: 1 as const,
  borderColor: colors.border,
  borderRadius: radii.md,
};

/** Primary CTA container */
export const primaryCta = {
  backgroundColor: colors.accent,
  borderRadius: radii.md,
};

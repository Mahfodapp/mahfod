/**
 * Mahfod Design System — unified export hub (MAHFOD_FINAL_PROMPTS spec)
 */

// ── Raw token re-exports ──────────────────────────────────────────────────────
export { colors, type ColorKey } from './colors';
export { spacing, radius, zIndex, elevation } from './spacing';
export { fonts, typography } from './typography';

import { colors }  from './colors';
import { fonts, typography } from './typography';
import { spacing, radius, zIndex, elevation } from './spacing';

// ── Shadows ────────────────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius:  12,
    elevation:     8,
  },
  deep: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.50,
    shadowRadius:  20,
    elevation:     16,
  },
  glow: {
    shadowColor:   colors.accent,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius:  12,
    elevation:     0,
  },
  glowStrong: {
    shadowColor:   colors.accent,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.80,
    shadowRadius:  30,
    elevation:     0,
  },
  glowDanger: {
    shadowColor:   colors.error,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius:  12,
    elevation:     0,
  },
} as const;

// ── Stage / Category semantic maps ─────────────────────────────────────────────
export const StageColors: Record<string, string> = {
  LEARNING:   colors.stageLearning,
  REVISION:   colors.stageReview,
  REVIEW:     colors.stageReview,
  MASTERED:   colors.stageMastered,
  memorizing: colors.stageLearning,
  review:     colors.stageReview,
  mastered:   colors.stageMastered,
};

export const StageLabels: Record<string, string> = {
  LEARNING:   'يُحفظ',
  REVISION:   'مراجعة',
  REVIEW:     'مراجعة',
  MASTERED:   'محكم',
  memorizing: 'يُحفظ',
  review:     'مراجعة',
  mastered:   'محكم',
};

export const CategoryColors: Record<string, string> = {
  'متن':    colors.catMatn,
  'شعر':    colors.catShir,
  'حديث':   colors.catHadith,
  'فقه':    colors.catFiqh,
  'فكرة':   colors.catFikra,
  'عقيدة':  colors.catOther,
  'تفسير':  colors.catOther,
  'سيرة':   colors.catOther,
  'دعاء':   colors.catOther,
};

// ── Glassmorphism presets ─────────────────────────────────────────────────────
export const Glass = {
  card: {
    backgroundColor: colors.surfaceRaised,
    borderWidth:     0.5,
    borderColor:     colors.border,
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth:     0.5,
    borderColor:     colors.border,
  },
  accentBordered: {
    backgroundColor: colors.accentSoft,
    borderWidth:     1.5,
    borderColor:     colors.accentBorder,
  },
} as const;

// ── Unified Colors alias object (all legacy + spec names) ──────────────────────
export const Colors = {
  // Spec exact
  primary:        colors.primary,
  primaryMid:     colors.primaryMid,
  primaryLight:   colors.primaryLight,
  surface:        colors.surface,
  surfaceRaised:  colors.surfaceRaised,
  surfaceHigh:    colors.surfaceHigh,
  surfaceHighest: colors.surfaceHighest,
  surfaceBright:  colors.surfaceBright,
  accent:         colors.accent,
  accentDim:      colors.accentDim,
  accentSoft:     colors.accentSoft,
  accentBorder:   colors.accentBorder,
  accentGlow:     colors.accentGlow,
  border:         colors.border,
  borderStrong:   colors.borderStrong,
  borderAccent:   colors.borderAccent,
  glassBorder:    colors.glassBorder,
  textPrimary:    colors.textPrimary,
  textSecondary:  colors.textSecondary,
  textMuted:      colors.textMuted,
  textAccent:     colors.textAccent,
  success:        colors.success,
  successSoft:    colors.successSoft,
  error:          colors.error,
  errorSoft:      colors.errorSoft,
  info:           colors.info,
  stageLearning:  colors.stageLearning,
  stageReview:    colors.stageReview,
  stageMastered:  colors.stageMastered,

  // Legacy aliases
  bg:             colors.primary,
  surfaceAlt:     colors.surfaceRaised,
  surfaceAlt2:    colors.surfaceHigh,
  glassCard:      colors.glassCard,
  overlay:        colors.overlay,
  overlayHeavy:   colors.overlayHeavy,
  danger:         colors.error,
  dangerSoft:     colors.errorSoft,
  warning:        colors.warning,
  warningSoft:    colors.warningSoft,
  statusReview:   colors.stageReview,
  statusMemorizing: colors.stageLearning,
  statusMastered: colors.stageMastered,
  catMatn:        colors.catMatn,
  catShir:        colors.catShir,
  catHadith:      colors.catHadith,
  catFiqh:        colors.catFiqh,
  catFikra:       colors.catFikra,
  catOther:       colors.catOther,
  white:          colors.white,
  black:          colors.black,
  transparent:    colors.transparent,

  // Extra legacy
  borderFocus:    colors.accent,
  textPlaceholder: colors.textMuted,
  red:            colors.error,
  yellow:         colors.accent,
  teal:           colors.stageMastered,
  amber:          colors.warning,
  accentBg:       colors.accentSoft,
  greenBg:        '#0c2e1a',
  blueBg:         '#0c1a24',
  purpleBg:       '#1a1f2e',
  amberBg:        '#2a1f00',
  redBg:          '#2d0a11',
  tealBg:         '#042f2e',
  orangeBg:       '#271b00',
};

// ── Unified Theme object ───────────────────────────────────────────────────────
export const Theme = {
  colors:         Colors,
  fonts,
  typography,
  spacing,
  radius,
  zIndex,
  elevation,
  shadows:        Shadows,
  glass:          Glass,
  stageColors:    StageColors,
  stageLabels:    StageLabels,
  categoryColors: CategoryColors,
};

export default Theme;

// ── Additional legacy named exports ───────────────────────────────────────────
export const Typography = typography;
export const Fonts      = fonts;
export const radii      = radius;

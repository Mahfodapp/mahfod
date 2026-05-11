/**
 * Mahfod Color Palette — MAHFOD_FINAL_PROMPTS spec-exact
 * Accent: #CCFF00 (lime-green) — ONLY primary action color
 * DO NOT modify without updating the spec.
 */
export const colors = {
  // Backgrounds
  primary:        '#0D0E10',
  primaryMid:     '#121316',
  primaryLight:   '#181A1C',
  surface:        '#121316',
  surfaceRaised:  '#181A1C',
  surfaceHigh:    '#1E2022',
  surfaceHighest: '#242629',
  surfaceBright:  '#2B2C2F',
  glassCard:      'rgba(255,255,255,0.03)',

  // Legacy aliases (keep for backward compat)
  bg:          '#0D0E10',
  surfaceAlt:  '#181A1C',

  // Accent (lime-green — ONLY primary action color)
  accent:       '#CCFF00',
  accentDim:    '#BEEE00',
  accentSoft:   'rgba(204,255,0,0.10)',
  accentBorder: 'rgba(204,255,0,0.22)',
  accentGlow:   'rgba(204,255,0,0.15)',

  // Borders
  border:         'rgba(255,255,255,0.08)',
  borderStrong:   'rgba(255,255,255,0.16)',
  borderAccent:   'rgba(204,255,0,0.25)',
  glassBorder:    'rgba(255,255,255,0.10)',

  // Text
  textPrimary:   '#FDFBFE',
  textSecondary: '#ABABAD',
  textMuted:     '#757578',
  textAccent:    '#CCFF00',

  // Semantic
  success:     '#00EDB4',
  successSoft: 'rgba(0,237,180,0.12)',
  error:       '#FF7351',
  errorSoft:   'rgba(255,115,81,0.12)',
  info:        '#AAFFDC',

  // Legacy semantic aliases
  danger:      '#FF7351',
  dangerSoft:  'rgba(255,115,81,0.12)',
  warning:     '#ffaa00',
  warningSoft: 'rgba(255,170,0,0.12)',

  // Memo stages
  stageLearning: '#AAFFDC',   // cyan — يُحفظ
  stageReview:   '#CCFF00',   // lime — مراجعة
  stageMastered: '#00EDB4',   // teal — محكم

  // Legacy stage aliases
  statusReview:     '#CCFF00',
  statusMemorizing: '#AAFFDC',
  statusMastered:   '#00EDB4',

  // Category chips (purple/pink allowed for category selection only)
  catMatn:    '#8b5cf6',
  catShir:    '#ec4899',
  catHadith:  '#14b8a6',
  catFiqh:    '#4ade80',
  catFikra:   '#f59e0b',
  catOther:   '#AAFFDC',

  // Glass / Overlay
  overlay:      'rgba(0,0,0,0.75)',
  overlayHeavy: 'rgba(0,0,0,0.90)',

  // Misc
  white:       '#ffffff',
  black:       '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;

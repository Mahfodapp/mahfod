/**
 * Mahfod Typography — Cairo Arabic-first
 *
 * Font loading (in App.tsx) uses expo-google-fonts:
 *   useFonts({ Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold })
 *
 * For Amiri / ScheherazadeNew (reading view):
 *   useFonts({ Amiri_400Regular, ScheherazadeNew_400Regular })
 */
import { colors } from './colors';

// ── Font family constants ────────────────────────────────────────────────────
export const fonts = {
  // Cairo — main UI font (Arabic-optimised, clean, modern)
  cairo:    'Cairo_400Regular',
  cairoSemi:'Cairo_600SemiBold',
  cairoBold:'Cairo_700Bold',
  koofi:    'Cairo_800ExtraBold',  // used for display / hero numbers

  // Reading-mode Arabic fonts (classical, high legibility)
  amiri:         'Amiri_400Regular',
  scheherazade:  'ScheherazadeNew_400Regular',
} as const;

// ── Type scale ───────────────────────────────────────────────────────────────
// All text is RTL-ready; writingDirection is set at input / text component level.
export const typography = {
  // Display (hero numbers, splash logo)
  hero: {
    fontFamily: fonts.koofi,
    fontSize:   64,
    lineHeight: 80,
    color:      colors.textPrimary,
  },
  displayLg: {
    fontFamily: fonts.koofi,
    fontSize:   40,
    lineHeight: 56,
    color:      colors.textPrimary,
  },
  displayMd: {
    fontFamily: fonts.cairoBold,
    fontSize:   28,
    lineHeight: 40,
    color:      colors.textPrimary,
  },
  displaySm: {
    fontFamily: fonts.cairoBold,
    fontSize:   22,
    lineHeight: 32,
    color:      colors.textPrimary,
  },

  // Titles
  titleLg: {
    fontFamily: fonts.cairoBold,
    fontSize:   18,
    lineHeight: 28,
    color:      colors.textPrimary,
  },
  titleMd: {
    fontFamily: fonts.cairoSemi,
    fontSize:   16,
    lineHeight: 24,
    color:      colors.textPrimary,
  },
  titleSm: {
    fontFamily: fonts.cairoSemi,
    fontSize:   14,
    lineHeight: 22,
    color:      colors.textPrimary,
  },

  // Body
  body: {
    fontFamily: fonts.cairo,
    fontSize:   15,
    lineHeight: 24,
    color:      colors.textPrimary,
  },
  bodySmall: {
    fontFamily: fonts.cairo,
    fontSize:   13,
    lineHeight: 20,
    color:      colors.textSecondary,
  },

  // UI micro-text
  caption: {
    fontFamily: fonts.cairo,
    fontSize:   12,
    lineHeight: 18,
    color:      colors.textSecondary,
  },
  label: {
    fontFamily: fonts.cairoSemi,
    fontSize:   11,
    lineHeight: 16,
    color:      colors.textMuted,
    letterSpacing: 0.5,
  },

  // Classical reading text (Amiri / Scheherazade)
  readingBase: {
    fontFamily: fonts.amiri,
    fontSize:   22,
    lineHeight: 44,
    color:      colors.textPrimary,
    textAlign:  'center' as const,
  },
  readingLg: {
    fontFamily: fonts.amiri,
    fontSize:   28,
    lineHeight: 56,
    color:      colors.textPrimary,
    textAlign:  'center' as const,
  },
} as const;

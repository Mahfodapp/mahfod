/**
 * Mahfod Typography Scale
 * Font: Cairo (loaded via @expo-google-fonts/cairo in App.tsx)
 *
 * All styles include fontFamily so they can be spread directly into StyleSheet.
 */

export const fonts = {
  regular: 'Cairo_400Regular',
  semi:    'Cairo_600SemiBold',
  bold:    'Cairo_700Bold',
  extra:   'Cairo_800ExtraBold',
  amiri:   'Amiri_400Regular',
  quran:   'ScheherazadeNew_400Regular',
  reemKufi: 'ReemKufi_400Regular',
  lateef:   'Lateef_400Regular',
  tajawal:  'Tajawal_400Regular',

  // Legacy aliases (keep backward compat)
  cairo:      'Cairo_400Regular',
  cairoSemi:  'Cairo_600SemiBold',
  cairoBold:  'Cairo_700Bold',
  cairoExtra: 'Cairo_800ExtraBold',
} as const;

export const typography = {
  display: {
    fontFamily: fonts.extra,
    fontSize: 34,
    lineHeight: 46,
  },
  h1: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 38,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fonts.semi,
    fontSize: 18,
    lineHeight: 28,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 28,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fonts.semi,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    fontFamily: fonts.semi,
    fontSize: 13,
    lineHeight: 18,
  },
} as const;

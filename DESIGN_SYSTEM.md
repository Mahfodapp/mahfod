# Mahfod — UI/UX Design System Skill
# AI must read this before generating any UI component or screen.
# This captures the EXACT visual language of the app — not generic guidelines.

---

## 1. VISUAL IDENTITY

### Personality
- **Dark, calm, sacred** — like a dimly lit study room at night
- **RTL Arabic-first** — all layouts flow right-to-left
- **Focused minimalism** — no decorative noise, every element earns its place
- **Premium but humble** — neon-lime accent on deep black, not flashy

### Mood keywords
`تركيز` (focus) · `هدوء` (calm) · `أصالة` (authenticity) · `عمق` (depth)

---

## 2. COLOR APPLICATION RULES

### Background hierarchy (deep → surface → raised)
```
Screen bg:        colors.primary       (#0D0E10)  — the void
Surface level 1:  colors.surface       (#121316)  — content containers
Surface level 2:  colors.surfaceRaised (#181A1C)  — cards, panels
Surface level 3:  colors.surfaceHigh   (#1E2022)  — elevated elements
Surface level 4:  colors.surfaceHighest(#242629)  — top-level chips, badges
```

### The Accent Rule (CRITICAL)
```
colors.accent = '#CCFF00'  ← lime-green
```
- **Primary CTA buttons** only (حفظ، بدء المراجعة، إضافة)
- **Active tab indicator dot**
- **Active icons and focused inputs**
- **Stage badge for REVISION**
- **Progress bars and rings**
- ❌ NEVER use for secondary text, backgrounds, or decorative purposes
- ❌ NEVER use for icons that are not primary actions

### Text color map
```
Headings (h1-h3):     colors.textPrimary   (#FDFBFE)
Body text:            colors.textPrimary   (#FDFBFE)
Supporting text:      colors.textSecondary (#ABABAD)
Hints / placeholders: colors.textMuted     (#757578)
Accent text:          colors.textAccent    (#CCFF00) ← only for key numbers/labels
```

### Stage color map
```
LEARNING  (يُحفظ):  colors.stageLearning  (#AAFFDC) — cyan, cool
REVISION (مراجعة): colors.stageReview    (#CCFF00) — lime, active
MASTERED  (محكم):   colors.stageMastered  (#00EDB4) — teal, accomplished
```

---

## 3. TYPOGRAPHY RULES

### Scale usage
```
typography.display (34px ExtraBold) → Hero numbers, big stats only
typography.h1      (28px Bold)      → Screen titles
typography.h2      (22px Bold)      → Section titles, card headers
typography.h3      (18px SemiBold)  → Sub-headers, list titles
typography.body    (16px Regular)   → Main content, memo text
typography.bodySmall(14px Regular)  → Supporting copy, descriptions
typography.label   (13px SemiBold)  → Chips, tags, badges
typography.caption (12px SemiBold)  → Timestamps, metadata
```

### Font weight semantics
- `weight="extra"` (ExtraBold 800) → Only for numbers and dramatic impact
- `weight="bold"` (Bold 700)       → Headings, primary labels
- `weight="semi"` (SemiBold 600)   → Sub-labels, button text, active tabs
- `weight="regular"` (Regular 400) → Body text, descriptions

### Arabic text rules
- All Arabic text: `textAlign: 'right'`
- Line height must be generous: min 1.6x font size for readability
- Numbers in Arabic context: use Arabic-Indic numerals where culturally appropriate
- Quran text ONLY: `fontFamily: fonts.quran` (ScheherazadeNew)
- Poetry/classical quotes: `fontFamily: fonts.amiri`

---

## 4. COMPONENT ANATOMY

### Card (src/shared/ui/Card.tsx)
```
backgroundColor: colors.surfaceRaised  (#181A1C)
borderRadius:    28                    ← large, modern
padding:         22
borderWidth:     1
borderColor:     rgba(255,255,255,0.05) ← barely visible
shadow:          {color:#000, opacity:0.16, radius:24, offset:{0,12}}
elevation:       4
interaction:     scale 0.985 on press (Reanimated withSpring)
```

### Button variants (src/shared/ui/Button.tsx)
```
PRIMARY (main CTA):
  bg: colors.accent (#CCFF00)
  text: colors.primary (dark on lime)
  borderRadius: 9999 (pill shape)
  minHeight: 52
  padding: 14v × 24h
  shadow: accent glow, animated pulse (0.35→0.65 opacity, 1100ms loop)
  press: scale 0.96 + haptic light

SECONDARY (outline):
  bg: transparent
  border: colors.accentBorder (rgba 204,255,0,0.22)
  text: colors.accent

DANGER:
  bg: rgba(255,115,81,0.12)
  border: colors.error
  text: colors.error

GHOST:
  bg: transparent
  text: colors.textSecondary
```

### Tab Bar (src/shared/ui/TabBar.tsx)
```
Container:
  bg: colors.primary
  borderTop: rgba(255,255,255,0.07) 1px
  height: 64px + safe area bottom

Tab items:
  Icon: 22px, lucide-react-native
  Inactive: colors.textMuted, strokeWidth 1.6
  Active:   colors.accent, strokeWidth 2
  Label: 10px SemiBold → Bold when active
  Active indicator: animated lime dot (16px wide, 3px tall, borderRadius 2)
  Press animation: spring bounce (scale 1→1.18→1)

FAB (center):
  Size: 60×60, borderRadius 30
  Color: colors.accent
  Icon: Plus (30px, dark)
  Glow ring: accent bg, opacity 0.22, scale 1.6
  Shadow: accent, opacity 0.65, radius 18
  Press: spring 0.86→1
  Action: navigate to AddMemoScreen
```

### Glass Panel (src/shared/ui/GlassPanel.tsx)
```
bg: rgba(255,255,255,0.03)  ← ultra-subtle glass
border: rgba(255,255,255,0.10)
borderRadius: 16
backdropFilter: blur (iOS only)
```

### Section (src/shared/ui/Section.tsx)
```
Title: typography.h3, colors.textPrimary
Subtitle/action: typography.label, colors.textMuted or colors.accent
MarginBottom: spacing.md (16)
```

---

## 5. SPACING & LAYOUT SYSTEM

### Screen layout
```
Outer padding (horizontal): 20px  ← from Screen.tsx contentContainerStyle
Top padding:                12px
Bottom padding:             120px ← clears the tab bar
```

### Card rhythm
```
Gap between cards:       spacing.md  (16px)
Gap between sections:    spacing.lg  (24px)
Inside card padding:     22px (Card default) or spacing.md (16px) for compact
```

### Touch targets
- Minimum: 44×44px (accessibility)
- Buttons: 52px height minimum
- Tab items: full 64px height zone

---

## 6. ANIMATION SYSTEM

### Principles
1. **Spring > Timing** — prefer `withSpring` over `withTiming` for interactive elements
2. **Subtle** — scale range 0.96–1.02, never drastic
3. **Haptic paired** — every meaningful press gets a haptic

### Standard spring configs
```typescript
// Snappy (press feedback)
withSpring(value, { damping: 15, stiffness: 300 })

// Bouncy (tab selection, success states)
withSpring(value, { damping: 9, stiffness: 280 })

// Gentle (entrance animations)
withSpring(value, { damping: 12 })
```

### Entrance animations (staggered)
```typescript
// Use moti for entrance — items appear in sequence
import { MotiView } from 'moti';

<MotiView
  from={{ opacity: 0, translateY: 16 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'timing', duration: 350, delay: index * 80 }}
>
  {/* card content */}
</MotiView>
```

### Haptic mapping
```typescript
import * as Haptics from 'expo-haptics';

// Light tap (tab navigation, quick actions)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

// Medium (FAB, primary CTA)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

// Success notification (memo added, review complete)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
```

---

## 7. ISLAMIC PATTERN BACKGROUND

```typescript
// ALWAYS behind all content, never scrolling
<View style={StyleSheet.absoluteFill} pointerEvents="none">
  <Image
    source={require('assets/images/islamic_pattern.png')}
    style={StyleSheet.absoluteFill}
    resizeMode="repeat"
    opacity={0.045}   // ← standard (Screen.tsx)
    // opacity={0.15}  // ← stronger (standalone MahfodPatternBackground)
  />
</View>
```
- Use `<Screen>` for all full-page screens — pattern is auto-included
- Use `<MahfodPatternBackground>` for custom layouts that don't use `<Screen>`

---

## 8. UX PATTERNS

### Empty States
```typescript
// Always provide: icon + Arabic title + subtitle + CTA
<EmptyState
  title="لا توجد مذكرات"
  subtitle="ابدأ بإضافة أول مذكرة"
  // optional action button
/>
```

### Loading States
- Use `ActivityIndicator` with `color={colors.accent}`
- Skeleton loading preferred for list items (animate opacity 0.3→0.6→0.3 loop)

### Error States
- Red tint: `colors.errorSoft` background + `colors.error` text
- Always offer a retry action

### Progress Indicators
- `<ProgressRing>` for circular (review sessions)
- `<SessionProgressBar>` for linear (in-session progress)
- Always fill with `colors.accent`

---

## 9. RTL LAYOUT RULES

```typescript
// Row layouts in Arabic screens
flexDirection: 'row-reverse'  // icon right, text left (as seen RTL)

// Text alignment
textAlign: 'right'  // for Arabic content

// Margin/padding in RTL (swap left/right manually in RN)
// RN does NOT auto-flip marginLeft/marginRight in RTL
marginRight: 12  // = visual "start" margin in RTL

// Navigation header: back arrow on RIGHT in RTL context
// (handled by React Navigation headerRight/headerLeft swap)
```

---

## 10. SCREEN COMPOSITION TEMPLATE

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from 'src/shared/ui/Screen';
import { MText } from 'src/shared/ui/MText';
import { colors, spacing, radius, typography } from 'src/shared/theme';

export function ExampleScreen() {
  return (
    <Screen>
      {/* ── Header ─────────────────── */}
      <View style={styles.header}>
        <MText weight="bold" style={styles.title}>عنوان الشاشة</MText>
        <MText weight="regular" style={styles.subtitle}>وصف مختصر</MText>
      </View>

      {/* ── Section 1 ───────────────── */}
      <View style={styles.section}>
        {/* cards, lists, etc */}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    alignItems: 'flex-end',  // RTL: align to right
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
});
```

---

## 11. ANTI-PATTERNS (NEVER DO)

```
❌ Light backgrounds — app is dark mode ONLY
❌ Blue/green primary buttons — accent is LIME only (#CCFF00)
❌ Rounded corners < 8px — everything is soft/rounded
❌ Centered Arabic text in lists — align right
❌ fontWeight: '700' in StyleSheet — use fonts.bold instead
❌ Animating with RN Animated API — use Reanimated only
❌ TouchableHighlight — use Pressable or TouchableOpacity
❌ Multiple font families per screen — Cairo everywhere, exceptions only for Quran/Amiri
❌ opacity: 0 as hidden state without animation — use conditional render
❌ Hard shadows without elevation — always pair shadow + elevation for Android
❌ Status bar white — already handled by dark userInterfaceStyle in app.json
```

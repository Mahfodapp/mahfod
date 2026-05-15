# Mahfod — UI/UX Design System v2.0
# AI MUST read this in full before generating any UI component, screen, or interaction.
# This is the single source of truth for Mahfod's visual language.
# Stack: React Native · Expo · Reanimated 3 · Moti · TypeScript · RTL Arabic-first

---

## ── PART 0: DESIGN IDENTITY ──────────────────────────────────────────────────

### Named Style: **"Sacred Dark"**
A fusion of three established styles adapted for Islamic scholarship UX:
- **Dark Mode OLED** — true near-black surfaces, zero light waste
- **Dimensional Layering** — depth through surface elevation, not shadows alone
- **Soft UI Evolution** — rounded, tactile, no hard edges or harsh contrasts

### Personality Archetype
> Imagine a scholar's study at 2am — a single lamp, open books, deep focus.
> The UI is the lamp. It should illuminate without glare.

Mood keywords: `تركيز` · `هدوء` · `أصالة` · `عمق` · `وضوح`

### Style Reasoning Rules (Mahfod-Specific)
```
App category:      Islamic Education / Spaced Repetition / Memorization
Platform:          React Native (iOS + Android)
Target user:       Student of Islamic scholarship — focused, patient, disciplined
Primary session:   Night-time study, low-ambient-light environment
Emotional register: Reverence, calm achievement, intellectual depth
→ Style outcome:   Sacred Dark (OLED + Dimensional + Soft)
→ Color mood:      Deep void + lime signal + teal/cyan accomplishment
→ Typography mood: Clean geometric (Cairo) with classical exception (Amiri/Scheherazade)
→ Motion style:    Spring-physics, never linear/snappy — breath-like
→ Anti-patterns:   Bright white surfaces, playful rounded mascots, vibrant multi-color
```

---

## ── PART 1: COLOR SYSTEM ─────────────────────────────────────────────────────

### Background Hierarchy (darkest → highest surface)
```
colors.primary        #0D0E10  ← Screen background — the void
colors.surface        #121316  ← Content containers
colors.surfaceRaised  #181A1C  ← Cards, panels (most common)
colors.surfaceHigh    #1E2022  ← Elevated elements, modals
colors.surfaceHighest #242629  ← Chips, badges, tooltips
colors.surfaceBorder  rgba(255,255,255,0.05)  ← All card borders
```

### The Accent Rule — LIME IS THE SIGNAL ⚡
```
colors.accent       #CCFF00  ← The ONLY primary CTA color
colors.accentSoft   rgba(204,255,0,0.12)  ← Glow bg, soft highlight
colors.accentBorder rgba(204,255,0,0.22)  ← Outline button borders
colors.textAccent   #CCFF00  ← Key numbers, metric labels only
```
**Accent is used for:**
- Primary CTA buttons (حفظ، بدء المراجعة، إضافة، التالي)
- Active tab indicator dot
- Active icon stroke
- Focused input border
- Progress bars, rings, streaks
- Stage badge: REVISION

**Accent is NEVER used for:**
- ❌ Secondary or body text
- ❌ Background fills (except soft glow `accentSoft`)
- ❌ Decorative icons or dividers
- ❌ Error or warning states

### Stage Color Semantics
```
LEARNING  (يُحفظ):  #AAFFDC  stageLearning  — cool cyan, "in process"
REVISION  (مراجعة): #CCFF00  stageReview    — lime, "active, due now"
MASTERED  (محكم):   #00EDB4  stageMastered  — teal, "accomplished, complete"
```
Each stage color must appear ONLY in: badge bg (8% opacity fill) + badge border + badge text.

### Semantic Colors
```
colors.error         #FF7351  ← Danger buttons, error states
colors.errorSoft     rgba(255,115,81,0.12)  ← Error card bg
colors.warning       #FFB800  ← Optional warning states
colors.success       #00EDB4  ← Success notification tint (= stageMastered)
colors.textPrimary   #FDFBFE  ← All headings, body
colors.textSecondary #ABABAD  ← Supporting text, labels
colors.textMuted     #757578  ← Hints, placeholders, metadata
colors.textAccent    #CCFF00  ← Numbers, key metrics
```

### Glow Effects (Accent Glow System)
```typescript
// Primary button glow — pulsing shadow
shadowColor:    colors.accent,
shadowOpacity:  interpolated 0.35→0.65 (Reanimated withRepeat),
shadowRadius:   18,
shadowOffset:   { width: 0, height: 4 }

// FAB glow ring — static
outerRing: { bg: colors.accentSoft, scale: 1.6, borderRadius: 30 }

// Input focus glow
borderColor:   colors.accent,
shadowColor:   colors.accent,
shadowOpacity: 0.25,
shadowRadius:  8
```

---

## ── PART 2: TYPOGRAPHY SYSTEM ────────────────────────────────────────────────

### Font Stack
```
Primary (all UI):     Cairo             — geometric, clean, Arabic-optimized
Quran text only:      ScheherazadeNew   — traditional, scholarly
Poetry / classical:   Amiri             — classical Arabic typography
Fallback:             System default
```

### Type Scale
```
typography.display    34px / ExtraBold 800  → Hero numbers, session stats, streak count
typography.h1         28px / Bold 700       → Screen titles
typography.h2         22px / Bold 700       → Section headers, card titles
typography.h3         18px / SemiBold 600   → Sub-headers, list group titles
typography.body       16px / Regular 400    → Memo text, descriptions, body
typography.bodySmall  14px / Regular 400    → Supporting copy, captions
typography.label      13px / SemiBold 600   → Chips, badges, tab labels
typography.caption    12px / SemiBold 600   → Timestamps, counts, metadata
```

### Arabic Typography Rules
```
Line height:    min 1.6× font size (Arabic glyphs need vertical breathing room)
Text alignment: right ('flex-end' for View wrappers)
Numerals:       Use Eastern Arabic (٠١٢٣٤٥٦٧٨٩) in Islamic content contexts
                Use Western (0123456789) for app metrics, counts, streaks
Quran text:     fontFamily: fonts.quran, lineHeight: fontSize × 2.0
Harakāt:        always ScheherazadeNew — Cairo cannot render them correctly
Letter spacing: 0 for Arabic (never apply letterSpacing to Arabic text)
Italic:         never — Cairo has no Arabic italic; it will render incorrectly
```

### Weight Decision Rule
```
ExtraBold 800 → Numbers, hero stats, dramatic impact ONLY
Bold 700      → Screen titles, card headers
SemiBold 600  → Buttons, active tab labels, chip text, sub-headers
Regular 400   → All body content, descriptions, placeholder text
```

---

## ── PART 3: COMPONENT SPECIFICATIONS ────────────────────────────────────────

### Card (src/shared/ui/Card.tsx)
```typescript
// Visual spec
backgroundColor: colors.surfaceRaised   // #181A1C
borderRadius:    28
padding:         22
borderWidth:     1
borderColor:     rgba(255,255,255,0.05)
shadow:          { color: '#000', opacity: 0.16, radius: 24, offset: {0,12} }
elevation:       4   // Android

// Interaction
onPress → scale: withSpring(0.985, { damping: 15, stiffness: 300 })
haptic  → Haptics.ImpactFeedbackStyle.Light

// Variants
Card.default   → padding: 22, borderRadius: 28  (standard)
Card.Compact   → padding: 14, borderRadius: 20
Card.Flat      → no shadow, no elevation, borderWidth: 1 only
Card.Elevated  → shadow.opacity: 0.24, elevation: 8  (review session hero card)
```

### Button (src/shared/ui/Button.tsx)
```typescript
// PRIMARY — main CTA (ONE per screen)
bg:           colors.accent         // #CCFF00
textColor:    colors.primary        // dark on lime
borderRadius: 9999                  // pill
minHeight:    52
padding:      { vertical: 14, horizontal: 24 }
fontWeight:   SemiBold 600
fontSize:     16
shadow:       { color: accent, opacity: animated 0.35→0.65, radius: 18 }
onPress:      scale withSpring(0.96) + Medium haptic

// SECONDARY — outline CTA
bg:           transparent
border:       colors.accentBorder   // rgba(204,255,0,0.22)
textColor:    colors.accent
onPress:      scale withSpring(0.97) + Light haptic

// DANGER
bg:           colors.errorSoft      // rgba(255,115,81,0.12)
border:       colors.error
textColor:    colors.error
onPress:      scale withSpring(0.97) + Medium haptic

// GHOST
bg:           transparent
textColor:    colors.textSecondary
onPress:      opacity briefly 0.6
```

### Input (src/shared/ui/MInput.tsx)
```typescript
bg:                colors.surface           // #121316
borderRadius:      16
borderWidth:       1
borderColor idle:  rgba(255,255,255,0.08)
borderColor focus: colors.accent
padding:           { vertical: 14, horizontal: 16 }
textAlign:         'right'                  // RTL
fontFamily:        fonts.cairo
fontSize:          16
placeholderColor:  colors.textMuted
onFocus →          glow: shadowColor accent, opacity 0.25, radius 8

// Multiline (memo text area)
minHeight:         120
textAlignVertical: 'top'
```

### Tab Bar (src/shared/ui/TabBar.tsx)
```typescript
// Container
bg:             colors.primary
borderTopColor: rgba(255,255,255,0.07)
borderTopWidth: 1
height:         64 + safeAreaBottom

// Tab item
iconSize:        22
iconStrokeWidth: inactive 1.6, active 2.0
iconColor:       inactive colors.textMuted, active colors.accent
labelSize:       10 (inactive), 10 bold (active)
labelColor:      inactive colors.textMuted, active colors.textPrimary

// Active indicator — animated lime dot
width: 16, height: 3, borderRadius: 2
color: colors.accent
animation: spring bounce on tab change

// Press
spring: withSpring(scale 1→1.18→1, { damping: 9, stiffness: 280 })
haptic: Light

// FAB (center tab — AddMemo)
size:     60×60, borderRadius: 30
bg:       colors.accent
iconColor:colors.primary
iconSize: 30 (Plus icon)
glowRing: { bg: accentSoft, opacity: 0.22, scale: 1.6 }
shadow:   { color: accent, opacity: 0.65, radius: 18 }
onPress:  spring 0.86→1 + Medium haptic → navigate AddMemoScreen
```

### Glass Panel (src/shared/ui/GlassPanel.tsx)
```typescript
bg:            rgba(255,255,255,0.03)
border:        rgba(255,255,255,0.10)
borderRadius:  16
backdropFilter: blur(12px)   // iOS only — no effect on Android, graceful degradation
```

### Progress Ring (src/shared/ui/ProgressRing.tsx)
```typescript
trackColor:    rgba(255,255,255,0.06)
progressColor: colors.accent
strokeWidth:   6
size:          80 (standard), 120 (hero display on Stats/Session screens)
centerLabel:   typography.display, colors.textAccent
animation:     withTiming(progress, { duration: 900, easing: Easing.out(Easing.cubic) })
```

### Stage Badge (src/shared/ui/StageBadge.tsx)
```typescript
// Structure: colored dot + Arabic label
LEARNING:  dot #AAFFDC, bg rgba(170,255,220,0.08), border rgba(170,255,220,0.20), text #AAFFDC
REVISION:  dot #CCFF00, bg rgba(204,255,0,0.08),   border rgba(204,255,0,0.20),   text #CCFF00
MASTERED:  dot #00EDB4, bg rgba(0,237,180,0.08),   border rgba(0,237,180,0.20),   text #00EDB4

borderRadius: 20
padding:      { vertical: 4, horizontal: 10 }
fontSize:     typography.label (13px SemiBold)
```

### Empty State (src/shared/ui/EmptyState.tsx)
```typescript
// Always: icon + Arabic h2 + body text + optional CTA
iconSize:      64
iconColor:     colors.textMuted
titleStyle:    typography.h2, colors.textPrimary, textAlign right
subtitleStyle: typography.body, colors.textSecondary, textAlign right
gap:           spacing.md between elements
cta:           Button PRIMARY (optional — only when a direct action exists)
```

### Skeleton Loader
```typescript
// For list items, cards during loading
bg:           colors.surfaceRaised
shimmer:      opacity animated 0.3→0.6→0.3, duration 1200ms, withRepeat(-1)
borderRadius: match the component it replaces
```

---

## ── PART 4: SPACING & LAYOUT ────────────────────────────────────────────────

### Spacing Scale
```
spacing.xxs  4px
spacing.xs   8px
spacing.sm   12px
spacing.md   16px   ← default gap between cards
spacing.lg   24px   ← between sections
spacing.xl   32px
spacing.xxl  48px
```

### Screen Layout Template
```typescript
// All full-page screens use <Screen> wrapper
paddingHorizontal: 20    // left + right gutters
paddingTop:        12
paddingBottom:     120   // clears tab bar + safe area
```

### Card Rhythm
```
Cards in a list:        gap: spacing.md (16px)
Section to section:     gap: spacing.lg (24px)
Inside card:            padding 22 (default) or 16 (compact)
Header to first card:   spacing.lg (24px)
```

### RTL Layout Rules
```typescript
// Row containers
flexDirection: 'row-reverse'    // icon on right (visual start), text on left

// Margins — RN does NOT auto-flip in RTL, do it manually
marginRight: X  → visual "start" margin (Arabic reading start)
marginLeft:  X  → visual "end" margin

// Alignment
alignItems: 'flex-end'   // right-aligns children in RTL column context
textAlign: 'right'       // all Arabic text

// Directional icons (chevrons, arrows) must be mirrored
transform: [{ scaleX: -1 }]
```

### Touch Targets
```
Minimum:      44×44px (accessibility standard)
Buttons:      52px height minimum
Tab items:    full 64px zone
List items:   56px height minimum
```

---

## ── PART 5: ANIMATION & MOTION SYSTEM ───────────────────────────────────────

### Motion Philosophy
```
1. Breath > Speed         — animations should feel like exhaling, not clicking
2. Spring > Timing        — withSpring for interactive, withTiming for progress/data
3. Stagger > Simultaneous — lists appear in sequence, not all at once
4. Haptic pairing         — every meaningful press gets a haptic
5. Never animate layout   — only transform, opacity, scale (perf rule)
6. Reduced motion         — always check useReducedMotion(), provide fallback
```

### Spring Presets
```typescript
SNAPPY:  { damping: 15, stiffness: 300 }  // press feedback, tab indicator
BOUNCY:  { damping: 9,  stiffness: 280 }  // tab selection, success state, FAB
GENTLE:  { damping: 12 }                   // entrance, modal appear
SLOW:    { damping: 20, stiffness: 120 }  // large layout shifts
```

### Named Micro-Interactions

**Card Press**
```typescript
// on press-in
scale: withSpring(0.985, SNAPPY)
haptic: Light
// on release
scale: withSpring(1.0, SNAPPY)
```

**FAB Press**
```typescript
scale: withSpring(0.86, BOUNCY)   // on press-in
scale: withSpring(1.0,  BOUNCY)   // on release
haptic: Medium
```

**Primary Button Pulse (idle glow)**
```typescript
// Runs continuously while button is mounted
shadowOpacity: withRepeat(
  withSequence(
    withTiming(0.35, { duration: 1100 }),
    withTiming(0.65, { duration: 1100 })
  ),
  -1,   // infinite
  true  // reverse
)
```

**Tab Selection Bounce**
```typescript
scale:     withSpring(1.18, BOUNCY) → withSpring(1.0, BOUNCY)
dotWidth:  withSpring(16, SNAPPY) on select → withSpring(8, SNAPPY) on deselect
haptic:    Light
```

**Review Card Flip (Memo reveal)**
```typescript
// Front → Back
rotateY: withTiming('180deg', { duration: 400, easing: Easing.out(Easing.quad) })
// Both card faces: backfaceVisibility: 'hidden'
// Trigger Medium haptic at the 50% point (interpolate from rotateY)
```

**Success Celebration**
```typescript
scale: withSequence(
  withSpring(1.08, BOUNCY),
  withSpring(0.97, SNAPPY),
  withSpring(1.0,  GENTLE)
)
haptic: Haptics.notificationAsync(NotificationFeedbackType.Success)
// Optional: staggered lime dot burst (Moti, 6–8 dots radiate outward)
```

**Screen Entrance (staggered list)**
```typescript
import { MotiView } from 'moti';

<MotiView
  from={{ opacity: 0, translateY: 16 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'timing', duration: 350, delay: index * 80 }}
>
  {/* card content */}
</MotiView>
```

**Modal / Bottom Sheet Appear**
```typescript
translateY: withSpring(0, GENTLE)       // slides up from bottom
opacity:    withTiming(1, { duration: 200 })
backdrop:   opacity withTiming(0.6, { duration: 250 })
```

### Haptic Map
```typescript
Light   → tab navigation, card tap, toggle switch, secondary button
Medium  → FAB press, primary CTA, swipe action confirm, danger confirm
Success → review session complete, memo mastered milestone, streak achieved
Error   → wrong answer in quiz, form validation fail
// Heavy haptic is NOT used — too jarring for scholarly context
```

---

## ── PART 6: SCREEN-LEVEL DESIGN SPECIFICATIONS ──────────────────────────────

### Home / Dashboard Screen
```
Layout priority:  Daily review CTA (accent PRIMARY button, always visible above fold)
Hero stat block:  streak count (display/34px), sessions today, mastered count
Card order:       1. Review due banner  2. Recent memos list  3. Stats summary
Empty state:      "لا توجد مذكرات — ابدأ بإضافة أول مذكرة" + FAB hint arrow
Pattern opacity:  0.045 (standard)
Entrance:         staggered MotiView on all cards (80ms delay)
```

### Review Session Screen
```
Layout:         Full screen — tab bar hidden (headerShown: false + tabBarVisible: false)
Center:         Memo card (Card.Elevated, large, gesture-swipeable left/right)
Bottom:         Two action buttons: "أعرفها" (SECONDARY) + "لم أعرفها" (DANGER)
Header:         ProgressRing (hero 120px) or linear SessionProgressBar
Card reveal:    Single tap → flip animation → show answer → show action buttons
Exit:           Session complete screen with SUCCESS celebration
Pattern:        0.045 opacity
```

### Add Memo Screen (Sheet)
```
Presentation:   Bottom sheet, 70% height, drag-handle visible, drag to dismiss
Fields:         Title (input), Matn text area (multiline), Category (picker), Source (input)
CTA:            PRIMARY button "حفظ المذكرة" — full width, pinned above keyboard
Keyboard:       KeyboardAvoidingView, scroll content up on focus
RTL:            All inputs right-aligned, textAlignVertical top for text area
Haptic:         Success on save, navigate back with slide-down animation
```

### Stats / Progress Screen
```
Hero:            ProgressRing (120px) — overall mastery percentage
Grid:            2-column bento cards — streak, total, reviews done, mastered
Chart:           Weekly review bar chart — bars fill with colors.accent
Stage breakdown: Horizontal stacked bar (stageLearning / stageReview / stageMastered)
Typography:      Display for hero numbers, label for chart axis, caption for dates
```

### Settings Screen
```
Layout:          Grouped list sections with GlassPanel section headers
Item row:        RTL row — label on right, value/toggle/chevron on left
Toggle:          accent active color, surfaceHighest track background
Destructive:     DANGER button isolated at bottom, preceded by separator
Navigation:      Back button on RIGHT (RTL), chevron mirrored (scaleX: -1)
```

### Onboarding Screens
```
Background:      Islamic pattern opacity 0.12–0.15 (stronger welcome feel)
Layout:          Full screen, no tab bar
Hero text:       h1 + bodySmall, right-aligned Arabic, centered vertically
CTA:             PRIMARY full-width button, bottom (above safe area)
Progress:        Dot indicators — lime active, muted inactive
Transition:      Horizontal slide (RTL direction — new screens slide in from left)
```

---

## ── PART 7: ISLAMIC AESTHETIC CODEX ─────────────────────────────────────────

### Pattern Background System
```typescript
// Standard — all screens via <Screen> (auto-included)
<Image
  source={require('assets/images/islamic_pattern.png')}
  style={StyleSheet.absoluteFill}
  resizeMode="repeat"
  opacity={0.045}
  pointerEvents="none"
/>

// Opacity levels by context
0.045  → standard screens (Home, Stats, Settings)
0.12   → onboarding hero screens, immersive moments
0.15   → <MahfodPatternBackground> standalone (custom layouts)

// Rules
// ✓ Always absoluteFill behind all content
// ✓ pointerEvents="none" — never intercepts touches
// ✓ Never scrolls with content
// ✗ Never exceed opacity 0.15 — becomes visual noise
// ✗ Never animate the pattern
```

### Color Meanings in Islamic Context
```
Lime   (#CCFF00)  — Signal, alertness, "now" — action and urgency, used sparingly
Teal   (#00EDB4)  — Completion, accomplishment — evokes the mercy of completion
Cyan   (#AAFFDC)  — Process, active learning — cool, focused, ongoing
Black  (#0D0E10)  — Sacred depth, the night of study, the void before illumination
White  (#FDFBFE)  — Clarity, revealed text — primary readable content
```

### Typography in Sacred Context
```
Cairo           → Modern scholarly Arabic — all UI labels, body, navigation
ScheherazadeNew → Quran and authenticated hadith text ONLY — never for UI chrome
Amiri           → Classical poetry, attributed quotes, scholarly epigraphs — use sparingly

SACRED TEXT RULE:
Quran ayaat must ALWAYS use ScheherazadeNew, never Cairo.
This is non-negotiable — it respects the dignity of the text.
Harakāt (tashkeel/vowel marks) require ScheherazadeNew — Cairo will fail to render them.
```

### Geometric Pattern Design Rules
```
Islamic geometric patterns are non-figurative — appropriate for all audiences.
The pattern tile must be:
  ✓ Infinitely tileable (seamless repeat)
  ✓ Geometric construction (8-point star, hexagonal grid, muqarnas-derived)
  ✗ No human or animal figures
  ✗ No calligraphy used purely decoratively (distorted, stretched)
  ✗ No symbols from other traditions mixed in
```

---

## ── PART 8: DESIGN REASONING ENGINE ─────────────────────────────────────────
## Antigravity: read this section to decide WHAT to build before writing code.

### Component Selection Rules

**Which Card variant?**
```
Card.default   → Memo list items, stat cards, generic content — most common
Card.Compact   → Dense lists, notification rows, picker items inside sheets
Card.Flat      → Nested inside another Card, transparent section wrappers
Card.Elevated  → The single hero card being actively studied (review session only)
GlassPanel     → Filter overlays, tooltip containers, supplementary info layers
```

**Which Button variant?**
```
PRIMARY    → ONE per screen — the most important action (حفظ، بدء، إضافة)
SECONDARY  → Alternative when PRIMARY exists (skip, cancel, alternative path)
DANGER     → Destructive confirms only (delete memo, clear data, reset progress)
GHOST      → Navigation links, "see all", tertiary non-critical text actions
```

**Which Typography size?**
```
Display/34   → Session complete hero number, streak milestone, mastery % circle center
H1/28        → Screen title (one per screen, right-aligned, top of page)
H2/22        → Section header, card title, modal title
H3/18        → List group title, sub-section header, filter category
Body/16      → Memo content, description, all paragraph-length text
BodySmall/14 → Card subtitle, supporting info, secondary description lines
Label/13     → Stage badges, chips, tab labels, category tags
Caption/12   → Timestamps, "last reviewed X days ago", card metadata
```

### Layout Decision Rules (RTL-first)
```
List of items            → FlatList/FlashList + MotiView staggered entrance
Single focus item        → Centered Card.Elevated, no list (review session)
Form / data entry        → KeyboardAvoidingView + ScrollView, all inputs right-aligned
Statistics / metrics     → 2-column grid bento layout (StyleSheet flexWrap row-reverse)
Confirmation / modal     → Bottom sheet, drag-handle, dismiss on backdrop tap
Full-immersive mode      → Hide tab bar, full-screen card (review, onboarding)
```

### Animation Decision Rules
```
User pressed a card          → SNAPPY scale 0.985 + Light haptic
User pressed primary button  → scale 0.96 + Medium haptic + action
User reveals review card     → flip animation (400ms) + Medium haptic at midpoint
User completes review session→ SUCCESS celebration sequence + Success haptic
List appears on screen       → staggered MotiView entrance (80ms delay per item)
Modal appears                → GENTLE slide up from bottom
Tab switches                 → BOUNCY dot indicator + SNAPPY icon scale bounce
Streak / milestone hit       → BOUNCY scale pulse on the number + Success haptic
Data loading (list)          → Skeleton shimmer (opacity loop 1200ms) — no empty flash
Error / validation fail      → brief red tint on element + Error haptic
Progress ring fills          → withTiming (900ms, cubic ease-out) — not spring
```

### Accessibility Decision Rules
```
All interactive elements     → minHeight 44, minWidth 44 (touch target law)
Arabic text contrast         → textPrimary on all surfaces ≥ 4.5:1 contrast ✓
Arabic line height           → always ≥ 1.6× font size
Reduced motion               → check useReducedMotion() — replace springs with opacity fade
Screen reader                → accessibilityLabel in Arabic for all icon-only buttons
Color-only state info        → never rely on color alone — add label or icon
```

---

## ── PART 9: PRE-DELIVERY CHECKLIST ─────────────────────────────────────────
## Run through every item before declaring any component or screen complete.

### Visual Correctness
```
[ ] Background is colors.primary (#0D0E10) — never white or light gray
[ ] Islamic pattern is present, absoluteFill, pointerEvents none, non-scrolling
[ ] ONE primary (lime) button per screen maximum
[ ] colors.accent (#CCFF00) used only for permitted elements (Part 1 rules)
[ ] All Arabic text is right-aligned (textAlign: 'right')
[ ] No fontWeight: '700' string — use fonts.bold token
[ ] Cairo for all UI text; ScheherazadeNew only for Quran/hadith content
[ ] No hard corners — borderRadius ≥ 8 everywhere (standard ≥ 16, cards ≥ 20)
[ ] Stage colors appear only in badge components (not used for other meaning)
```

### RTL Compliance
```
[ ] All row containers use flexDirection: 'row-reverse'
[ ] Directional icons (chevron, arrow, back) have transform: [{ scaleX: -1 }]
[ ] marginLeft/marginRight manually swapped for RTL context
[ ] Navigation back button appears on RIGHT side of header
[ ] All input text is right-aligned; cursor starts at right
[ ] List items read naturally right-to-left (label → value order)
[ ] Onboarding slides transition in RTL direction
```

### Animation Compliance
```
[ ] Zero usage of Animated API — Reanimated 3 only
[ ] No linear withTiming for interactive presses — withSpring only
[ ] Progress rings and data bars use withTiming (not spring — data, not gesture)
[ ] Every press handler has a matching haptic call
[ ] Entrance animations staggered (not all firing simultaneously)
[ ] No animation causes layout shift — only transform/opacity/scale animated
[ ] useReducedMotion() checked — fallback to instant opacity for all springs
```

### Typography Compliance
```
[ ] Arabic line height ≥ 1.6× font size for all text
[ ] Zero letterSpacing on Arabic text (breaks glyph shaping)
[ ] Zero italic on Arabic (Cairo has no italic — will render wrong)
[ ] Quran text uses ScheherazadeNew with 2.0× line height
[ ] Hero numbers use display/34px, not h1
[ ] Timestamps and metadata use caption/12px
```

### Performance
```
[ ] FlatList or FlashList used for any list > 10 items (not map inside ScrollView)
[ ] Images have explicit width/height or flex (no layout thrash)
[ ] renderItem function is stable (useCallback) — no anonymous functions
[ ] Skeleton loader shown during load states — no empty white flash
[ ] useSharedValue defined at component level, not inside render
[ ] No heavy computation inside render — use useMemo
```

### Accessibility
```
[ ] All icon-only buttons have accessibilityLabel in Arabic
[ ] All touch targets ≥ 44×44px
[ ] useReducedMotion() respected — tested
[ ] Error states communicated by text label + color (not color alone)
[ ] Quran/hadith text marked with appropriate accessibilityLanguage: 'ar'
```

---

## ── PART 10: ANTI-PATTERNS (ABSOLUTE PROHIBITIONS) ─────────────────────────

```
❌ Light backgrounds            — dark mode ONLY, always, no exceptions
❌ Blue/green/purple CTAs       — accent is LIME #CCFF00, nothing else
❌ White or near-white fills    — lowest surface is #0D0E10
❌ Multiple primary buttons     — one CTA per screen, rules everything
❌ Centered Arabic in lists     — always right-aligned
❌ fontWeight: '700' string     — use fonts.bold token
❌ Animated API                 — Reanimated 3 exclusively
❌ TouchableHighlight           — Pressable or TouchableOpacity only
❌ Multiple font families       — Cairo everywhere; Scheherazade/Amiri for sacred/classical only
❌ opacity: 0 without animation — conditionally render or use pointerEvents none
❌ Shadow without elevation     — always pair shadow + elevation for Android
❌ borderRadius < 8             — everything is soft (standard ≥ 16, cards ≥ 20, buttons = 9999)
❌ letterSpacing on Arabic      — breaks glyph shaping, renders incorrectly
❌ Italic on Arabic text        — Cairo has no Arabic italic weight
❌ Animate layout dimensions    — only transform/opacity/scale (performance)
❌ Anonymous functions in FlatList renderItem — breaks memoization, causes re-renders
❌ Human or animal figures      — keep visuals non-figurative per Islamic aesthetic
❌ Gradient backgrounds         — flat dark surfaces only; glow via shadow, not gradient bg fills
❌ Emoji as icons               — use Lucide React Native SVG icons exclusively
❌ Pattern opacity > 0.15       — Islamic pattern must stay subtle, never dominant
❌ ScrollView for long lists    — FlatList or FlashList
❌ Cairo rendering Quran text   — ScheherazadeNew is mandatory for Quranic content
❌ Stage colors outside badges  — stageLearning/stageReview/stageMastered tokens for badges only
```

---

## ── PART 11: QUICK REFERENCE TOKEN MAP ──────────────────────────────────────

```typescript
// Import pattern for all components
import { colors, spacing, radius, typography, fonts } from 'src/shared/theme';

// Most-used color tokens
colors.primary          // #0D0E10   screen bg
colors.surface          // #121316   container bg
colors.surfaceRaised    // #181A1C   card bg (most common)
colors.accent           // #CCFF00   lime CTA, active states
colors.textPrimary      // #FDFBFE   all readable text
colors.textSecondary    // #ABABAD   supporting text
colors.textMuted        // #757578   hints, placeholders
colors.textAccent       // #CCFF00   key numbers, metrics
colors.error            // #FF7351   danger states
colors.stageLearning    // #AAFFDC   learning stage
colors.stageReview      // #CCFF00   revision stage
colors.stageMastered    // #00EDB4   mastered stage

// Most-used spacing tokens
spacing.xs   // 8
spacing.sm   // 12
spacing.md   // 16   (card gap)
spacing.lg   // 24   (section gap)
spacing.xl   // 32

// Most-used radius tokens
radius.card    // 28  (Card default)
radius.compact // 20  (Card.Compact)
radius.input   // 16  (inputs, glass panels)
radius.button  // 9999 (pill buttons)
radius.badge   // 20  (stage badges, chips)

// Font tokens
fonts.cairo     // 'Cairo'
fonts.quran     // 'ScheherazadeNew'
fonts.amiri     // 'Amiri'
fonts.bold      // { fontFamily: 'Cairo', fontWeight: '700' }
fonts.semiBold  // { fontFamily: 'Cairo', fontWeight: '600' }
fonts.regular   // { fontFamily: 'Cairo', fontWeight: '400' }
```

---

## ── PART 12: SCREEN COMPOSITION TEMPLATE ────────────────────────────────────

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Screen } from 'src/shared/ui/Screen';
import { MText } from 'src/shared/ui/MText';
import { Card } from 'src/shared/ui/Card';
import { colors, spacing, typography } from 'src/shared/theme';

export function ExampleScreen() {
  return (
    <Screen>
      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <MText weight="bold" style={styles.screenTitle}>عنوان الشاشة</MText>
        <MText weight="regular" style={styles.screenSubtitle}>وصف مختصر</MText>
      </View>

      {/* ── Section ────────────────────────────────── */}
      <View style={styles.section}>
        <MText weight="semi" style={styles.sectionTitle}>عنوان القسم</MText>

        {items.map((item, index) => (
          <MotiView
            key={item.id}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350, delay: index * 80 }}
          >
            <Card onPress={() => handlePress(item)}>
              {/* card content */}
            </Card>
          </MotiView>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    alignItems: 'flex-end',            // RTL: align right
  },
  screenTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  screenSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
});
```

# MAHFOD — Project Concepts & Architecture Reference

> **For AI Assistants**: This file defines the canonical project knowledge. Always read this before generating code.

---

## 1. What Is Mahfod?

Mahfod (محفوظ) is an **offline-first Arabic memorization app** for Islamic texts — Quran, Hadith, poems, and scholarly متن. It implements a customized **Spaced Repetition System (SRS)** inspired by SM-2 to help users memorize and retain Arabic texts long-term.

The app has two primary modes:
- **Memo Mode** — Add, organize, and review memorized texts (مذكرات)
- **Noter Mode** — A digital notebook for books, chapters, and reading notes

---

## 2. Core Domain Concepts

### Memo (`src/types/index.ts` → `Memo`)
The atomic unit of the app. A piece of text the user is memorizing.
```typescript
interface Memo {
  id: string;           // nanoid
  title: string;        // e.g. "البيت الأول من الآجرومية"
  text: string;         // the actual Arabic text to memorize
  label: string;        // category: 'متن' | 'شعر' | 'حديث' | 'فقه' | 'عقيدة' | ...
  stage: MemoStage;     // 'LEARNING' | 'REVISION' | 'MASTERED'
  repetition_count: number;  // times repeated (governs LEARNING stage)
  review_count: number;      // total review sessions
  next_review_at: string;    // ISO date — when due for review
  is_favorite: boolean;
  is_poem: boolean;          // enables verse/line display mode
}
```

### MemoStage
- **LEARNING** (يُحفظ) — Active memorization phase. User repeats daily until `repetition_count >= initial_reps` (default: 33).
- **REVISION** (مراجعة) — Spaced review phase. SM-2 algorithm schedules next review date.
- **MASTERED** (محكم) — Fully memorized. Periodic reinforcement only.

### Review Session (`src/features/srs/`)
- The daily review flow where memos due today are shown one by one.
- Behaviour is governed by **`settings.revision_mode`** (see §3 below).
- "Mohkam Session" = special intensive session for MASTERED memos

### Revision Modes (`RevisionMode = 'fixed' | 'sm2'`)
Set by the user in **Settings → نظام المراجعة**.

| | Fixed (`'fixed'`) | Intelligent SM-2 (`'sm2'`) |
|---|---|---|
| UI | Counter button **كررت (N/M)** | Read → rate **نسيت / صعب / حسناً / سهل** |
| Scheduling | next_review_at = +1 day (daily) | SM-2 computes interval |
| Graduation | review_count >= `revision_reps` | review_count >= `revision_reps` |
| Mohkam reps | User sets `reinforce_reps` | User sets `reinforce_reps` |

Engine: `src/features/srs/logic/revisionEngine.ts` → `applyRevision(memo, quality, settings)`

### NoterBook / NoterNote (`src/features/memo/`)
- Digital library: books → chapters → notes
- Note types (NoteType): فكرة, قلت, تلخيص, أبيات, تعقيب

---

## 3. Revision Engine & SM-2 Algorithm

**Revision Engine (use this, not sm2.ts directly)**:
```typescript
import { applyRevision } from 'src/features/srs/logic/revisionEngine';

// Call after each completed review session:
const result = applyRevision(memo, quality, settings);
// quality: 0|1|2|3 for SM-2 mode, null for fixed mode
// Returns: { review_count, next_review_at, last_reviewed_at, stage }
await updateMemo(memo.id, result);
```

**Raw SM-2 (only for direct SM-2 work)**:
```typescript
// File: src/features/srs/logic/sm2.ts
calculateNextReview(state: SM2State, quality: 0|1|2|3, settings: Settings): SM2State
// Returns updated: reviewCount, easeFactor, intervalDays, nextReviewAt, stage
```

**Stage Graduation Rules** (both modes):
- LEARNING → REVISION: `repetition_count >= settings.initial_reps` (default 33)
- REVISION → MASTERED: `review_count >= settings.revision_reps` (default 30)

**Ease Factor** (SM-2 only): starts at 2.5, min 1.3. Adjusted by quality rating.

---

## 4. Data Architecture

### Local-First with Supabase Sync
```
User Action
    ↓
Drizzle (expo-sqlite)  ← immediate, always works offline
    ↓
offlineQueue table     ← records pending sync operations
    ↓ (when online)
Supabase               ← cloud backup + multi-device sync
```

### Conflict Resolution
- Every record has `version: integer` (incremented on update)
- `device_id` + `last_modified_by` for tracking
- `deleted: boolean` for soft deletes (never hard delete)
- `synced_at` timestamp for sync tracking

### Drizzle Client
```typescript
import { db } from 'src/infrastructure/db/client';
// Tables: memos, noter_books, noter_chapters, noter_notes, user_settings, offlineQueue
```

---

## 5. Design System — The Law

### Colors (IMMUTABLE — never change without spec update)
| Token | Value | Use |
|---|---|---|
| `colors.primary` | `#0D0E10` | App background |
| `colors.accent` | `#CCFF00` | **THE ONLY primary action color** |
| `colors.success` | `#00EDB4` | Mastered stage |
| `colors.error` | `#FF7351` | Errors / forgot |
| `colors.textPrimary` | `#FDFBFE` | Main text |
| `colors.textMuted` | `#757578` | Placeholder text |

### Typography Rules
1. **Always use `<MText>`** — never raw `<Text>`
2. **Font families via `fonts.*`** — never hardcode strings
3. **Cairo** for all UI text, **Scheherazade New** for Quran only, **Amiri** for poetic quotes

### The `<Screen>` Component
```typescript
// Use for all full-page screens — handles SafeArea + background + scroll
import { Screen } from 'src/shared/ui/Screen';

function MyScreen() {
  return (
    <Screen>
      {/* your content */}
    </Screen>
  );
}
```

---

## 6. State Management Map

| Store | File | Purpose |
|---|---|---|
| `useAuthStore` | `src/features/auth/store/auth.store.ts` | User session, guest mode |
| `useMemoStore` | `src/features/memo/store/memo.store.ts` | Memo CRUD, fetch |
| `useSettingsStore` | `src/features/settings/store/settings.store.ts` | User preferences |

**Cross-store access**: `useOtherStore.getState()` (NOT hooks inside async actions)

---

## 7. Navigation Reference

### Adding a new screen:
1. Add to `RootStackParamList` in `src/navigation/types.ts`
2. Import screen in `src/navigation/RootNavigator.tsx`
3. Add `<Stack.Screen>` entry
4. Navigate: `navigation.navigate('ScreenName', { params })`

### Current routes:
```
AuthScreen, MainTabs, AddMemoScreen, MemoLibraryScreen,
ReviewSessionScreen, MohkamSessionScreen, SettingsScreen,
AddNoterBookScreen, NoterDetailScreen
```

---

## 8. Feature Slice Structure

Each feature in `src/features/X/` follows:
```
X/
├── components/    ← UI components specific to this feature
├── screens/       ← Full-page screen components
├── services/      ← Business logic, DB queries (Drizzle)
├── store/         ← Zustand store(s)
└── logic/         ← Pure functions (e.g., sm2.ts, intervals.ts)
```

---

## 9. Coding Checklist (AI must verify before output)

- [ ] Using `<MText>` not `<Text>`?
- [ ] Colors from `colors.*` tokens, not hardcoded?
- [ ] Font family from `fonts.*`, not hardcoded string?
- [ ] Navigation param type added to `RootStackParamList`?
- [ ] DB operation uses Drizzle, not raw SQL?
- [ ] New IDs generated with `nanoid()`?
- [ ] Mutations enqueue to `offlineQueue` for sync?
- [ ] SRS logic uses `calculateNextReview()` from sm2.ts?
- [ ] Arabic text is RTL-aware?
- [ ] Loading, empty, and error states handled?
- [ ] Animations via Reanimated (not `Animated` from RN)?
- [ ] TypeScript types defined, no `any`?

---

## 10. Few-Shot Examples

### Correct: Adding a card component
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MText } from 'src/shared/ui/MText';
import { colors, spacing, radius, typography } from 'src/shared/theme';

export function ExampleCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.card}>
      <MText weight="bold" style={styles.title}>{title}</MText>
      <MText weight="regular" style={styles.subtitle}>{subtitle}</MText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
```

### Correct: Recording a review result
```typescript
import { calculateNextReview } from 'src/features/srs/logic/sm2';
import { useSettingsStore } from 'src/features/settings/store/settings.store';

// Inside review handler:
const settings = useSettingsStore.getState().settings;
const newState = calculateNextReview(
  { reviewCount: memo.review_count, easeFactor: 2.5, intervalDays: 1, ... },
  quality, // 0|1|2|3
  { initialRepetitions: settings.initial_reps, masteryThreshold: 100, ... }
);
await memoService.updateMemo(memo.id, {
  review_count: newState.reviewCount,
  next_review_at: newState.nextReviewAt,
  stage: newState.stage,
});
```

### Wrong ❌ — Never do this
- never use indian numbers
- never do lazy inaccurate job
- never use colors that are not from our visual identity
- never forget that this is a fancy professional high rated work

```typescript
// ❌ Hardcoded color
<View style={{ backgroundColor: '#0D0E10' }}>

// ❌ Raw Text without font
<Text style={{ fontFamily: 'Cairo_700Bold' }}>نص</Text>

// ❌ Inventing scheduling logic
const nextDate = new Date();
nextDate.setDate(nextDate.getDate() + 7); // WRONG - use sm2.ts

// ❌ Cross-store hook inside action
const settings = useSettingsStore(); // WRONG inside async action

// ❌ Indian/Eastern Arabic numerals — use Western digits only
<MText>٣٣ مرة</MText>          // WRONG
<MText>{String(33)} مرة</MText> // ✓ always use 0-9, never ٠-٩

// ❌ Lazy work — incomplete, placeholder, or stub implementations
// Every feature must be fully wired, tested in both modes, and RTL-correct.
// "It works for now" is not acceptable. Do it right the first time.

// ❌ Disobeying visual identity
// - Only colors.accent (#CCFF00 lime) as the primary action/active color
// - No unauthorized colors (no blue, no teal for interactive elements)
// - No raw hex values anywhere in UI code
// - All text via <MText>, all layout RTL-first (flexDirection: 'row', let I18nManager handle it)
// - Stage colors (stageLearning/stageReview/stageMastered) are for stage
//   indicators ONLY — never for interactive controls or buttons
```

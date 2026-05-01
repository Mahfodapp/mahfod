# Mahfod App: Technical Handoff & Project History

## 1. The "Sad Story": Our Journey & Miscommunications

This document serves as a comprehensive handoff report for the Mahfod application. It outlines the technical architecture of the app and chronicles the history of our restoration attempts. 

Our journey began with a monumental task: **Forensic Codebase Reconstruction**. You provided `mahfod_recovered.js`, a massive 36MB obfuscated React Native production bundle, and asked me to extract its logic, UI components, and architectural patterns to restore the original Mahfod application 1:1.

### The Struggles & Roadblocks
1. **Metro Bundler Memory Crashes**: Early on, the sheer size of the project and the 3,738 modules caused critical `JavaScript heap out of memory` errors during the Android build. We resolved this by increasing Node's memory allocation and cleaning up port 8081.
2. **Dependency Nightmares**: Moving from an older Expo build to the current Expo 51 environment led to severe dependency mismatches. Most notably, adding high-fidelity UI gestures caused the app to crash with `layoutState.get is not a function`. We tracked this down to a version conflict between `react-native-reanimated` (pinned at 3.10.1 by Expo) and `@gorhom/bottom-sheet` (v5). Rolling back the bottom sheet to v4 stabilized the app.
3. **The Data Layer**: We successfully moved away from static, hallucinated states to a robust, local-first architecture. We integrated `drizzle-orm` with Expo SQLite, structuring a proper schema with `memos`, `notes`, and spaced repetition (`srsEngine`) persistence.
4. **The UI/UX Disconnect (The Final Straw)**: Despite resolving the functional backend, our visual synchronization failed completely. The goal was a 10/10 premium, professional interface with a specific Dark Mode, pure black aesthetics, neon lime (`#CCFF00`), and glassmorphism. I mistakenly assumed the app needed basic placeholder colors, yielding a "2/10" amateur look. In a final, flawed attempt to correct the visual identity, I wrapped all screens in static image backgrounds (`bg_1.png`, etc.), which fundamentally contradicted the clean, code-driven UI you desired. This made the app look even more amateur ("rabbishic"). 

I apologize for treating the design process with an amateur approach. Below is the technical blueprint of the app to ensure your seamless transition to Cursor.

---

## 2. Technical Architecture Overview

The Mahfod application is a local-first, React Native (Expo) application designed for structured memorization, spaced repetition (SM-2 algorithm), and note-taking. 

### Core Tech Stack
* **Framework**: React Native (Expo SDK 51)
* **Language**: TypeScript
* **State Management**: Zustand (`src/store/useMemoStore.ts`, `src/store/useAuthStore.ts`)
* **Local Database**: SQLite (`expo-sqlite/next`) + Drizzle ORM (`drizzle-orm`)
* **Navigation**: React Navigation (Native Stack + Bottom Tabs)
* **Animations/Gestures**: `react-native-reanimated` (v3.10.1), `react-native-gesture-handler`, `@gorhom/bottom-sheet` (v4.6.4)
* **Icons**: `lucide-react-native`

---

## 3. Data Layer & SQLite Schema (`src/db/schema.ts`)

The app relies heavily on a persistent local SQLite database to enable offline-first capabilities.

### `memos` Table
Stores the primary content the user is attempting to memorize.
* `id` (UUID)
* `title`, `text`, `categories`
* `isPoetry` (boolean for formatting)
* `stage` ('LEARNING', 'REVIEW', 'MASTERED')
* **Spaced Repetition Fields**: 
  * `nextReviewAt` (Timestamp)
  * `interval` (Days until next review)
  * `easeFactor` (SM-2 multiplier)
  * `consecutiveDays` (Streak)

### `notes` Table
Serves as the user's freeform workspace, linked to references.
* `id`, `bookId`
* `text` (Draft content)
* `label`, `pageNumber` (Reference tracking)
* `deleted` (Soft delete flag)

---

## 4. State Management (`src/store/useMemoStore.ts`)

Zustand acts as the bridge between the React components and the SQLite database.
* **Initialization**: The `initDB()` function sets up Drizzle and performs initial migrations/syncs.
* **processRevision**: The core business logic. It takes a `memoId` and a user-provided `quality` rating (1-5), passes it to the `srsEngine`, calculates the new interval, and updates the database.

---

## 5. UI/UX Structure (Screens & Components)

### Navigation Architecture (`src/navigation/`)
* **BottomTabBar**: A custom-designed navigation bar featuring 5 primary routes and a distinct floating action button (FAB) for adding new content.

### Primary Screens (`src/screens/`)
1. **`DashboardScreen.tsx`**: The main landing page. Displays user statistics, overall repetition counts, and quick-action cards to dive into memorization or reviews.
2. **`HomeScreen.tsx` (Library)**: Displays the user's saved items. Supports three viewing modes (Shelf, Grid/Cover, List) and categorizes items by status (Learning, Review, Mastered).
3. **`DailyReviewScreen.tsx`**: The Spaced Repetition interface. Hides the text initially, asks the user to recall it, and then presents grading buttons (Forgot, Good, Easy) to calculate the next review interval.
4. **`NoterScreen.tsx`**: A distraction-free writing environment. Includes a rich-text canvas and a sliding side drawer (powered by Reanimated) that displays linked references to assist in summarization.
5. **`AddMemoScreen.tsx`**: The content creation flow. Utilizes `@gorhom/bottom-sheet` for category selection and allows optional media attachments (Audio/Images).

---

## 6. Next Steps for the Cursor Agent

To the AI or developer taking over:
1. **Revert ImageBackgrounds**: Remove the `<ImageBackground>` wrappers I recently added to `DashboardScreen.tsx`, `HomeScreen.tsx`, `NoterScreen.tsx`, and `AddMemoScreen.tsx`. Restore them to pure React Native `View` components with a code-driven UI layout.
2. **Refine Styling**: Focus heavily on the `src/theme/index.ts`. The client demands high-fidelity, code-generated UI components (Glassmorphism, drop shadows, gradients, exact padding) using pure black (`#000000`) and neon lime green (`#CCFF00`), not generic background images.
3. **Audio/Media Enhancements**: `AddMemoScreen` has rudimentary Audio support using `expo-av`. This needs to be expanded into a visual waveform player.
4. **i18n Implementation**: Replace hardcoded Arabic text across the screens with proper localized keys from `src/i18n/index.ts`.

I wish you the best in fully restoring Mahfod to its rightful, premium state.

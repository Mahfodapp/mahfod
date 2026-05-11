# Mahfod App — System Instructions for Claude

You are an expert React Native developer working exclusively on the **Mahfod (محفوظ)** app — an Arabic offline-first memorization app built with Expo 51.

## MANDATORY: Read project context first
At the start of every session, read these files:
- `.antigravity-context` — exact tech stack, design tokens, schema, and rules
- `CONCEPTS.md` — domain concepts, architecture, examples
- `DESIGN_SYSTEM.md` — exact UI/UX design components, colors, and animation specs

## Core Identity
- RTL Arabic app — all UI text in Arabic
- Dark theme only (userInterfaceStyle: "dark")
- Accent: #CCFF00 (lime-green) — the ONLY primary action color
- Font: Cairo for all UI, ScheherazadeNew for Quran text only
- Offline-first: local SQLite (Drizzle) → Supabase cloud sync

## Always think step-by-step before coding:
1. Feature domain? (auth / memo / srs / settings / quran / noter / sync)
2. Existing shared component available in `src/shared/ui/`?
3. Correct design tokens? (colors.* / fonts.* / spacing.* / radius.*)
4. Edge cases: loading state, empty state, error state, offline state
5. TypeScript types up to date?
6. Navigation route registered?

## Never do:
- Raw `<Text>` → use `<MText>`
- Hardcoded hex colors → use `colors.*`
- Raw SQL → use Drizzle client
- Custom review scheduling → use `calculateNextReview()` in sm2.ts
- Hard deletes → soft delete with `deleted: true`
- Polling for sync → event-driven via offlineQueue

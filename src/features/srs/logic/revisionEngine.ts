/**
 * revisionEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for post-revision memo updates.
 *
 * Two modes (driven by settings.revision_mode):
 *
 *  'fixed' — Simple, predictable daily schedule.
 *    • Every successful session increments review_count by 1.
 *    • next_review_at advances by exactly 1 day (daily cadence).
 *    • When review_count >= settings.revision_reps → stage = 'MASTERED'.
 *    • No quality rating needed — caller passes quality = null.
 *
 *  'sm2' — Scientific Spaced Repetition (SM-2 algorithm).
 *    • Caller passes quality (0=نسيت | 1=صعب | 2=حسناً | 3=سهل).
 *    • Algorithm adjusts ease-factor and computes the next interval in days.
 *    • When review_count >= settings.masteryThreshold → stage = 'MASTERED'.
 */

import { Memo, UserSettings } from '../../../types';
import { calculateNextReview, SM2State } from './sm2';

// ─── Result shape ─────────────────────────────────────────────────────────────

export interface RevisionResult {
  review_count:    number;
  next_review_at:  string;
  last_reviewed_at: string;
  stage:           Memo['stage'];
  /** SM-2: updated ease factor — persisted back to memo */
  ease_factor:     number;
  /** SM-2: updated interval — persisted back to memo */
  interval_days:   number;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Call this after the user completes one revision session for a memo.
 *
 * @param memo      - current memo snapshot
 * @param quality   - 0-3 (SM-2 mode) or null (fixed mode)
 * @param settings  - current user settings
 */
export function applyRevision(
  memo: Memo,
  quality: 0 | 1 | 2 | 3 | null,
  settings: UserSettings,
): RevisionResult {
  const now          = new Date();
  const tomorrow     = addDays(now, 1);
  const newReviewCount = (memo.review_count ?? 0) + 1;

  // ── Fixed mode ─────────────────────────────────────────────────────────────
  if (settings.revision_mode === 'fixed') {
    const threshold = settings.revision_reps ?? 30;
    const graduated = newReviewCount >= threshold;
    return {
      review_count:     newReviewCount,
      next_review_at:   tomorrow.toISOString(),
      last_reviewed_at: now.toISOString(),
      stage:            graduated ? 'MASTERED' : 'REVISION',
      ease_factor:      memo.ease_factor ?? 2.5,
      interval_days:    1,
    };
  }

  // ── SM-2 mode ──────────────────────────────────────────────────────────────
  const q = quality ?? 2; // default to 'ok' if somehow null in sm2 mode

  const sm2State: SM2State = {
    reviewCount:    memo.review_count    ?? 0,
    // Read persisted ease_factor — default to 2.5 only for the very first session
    easeFactor:     memo.ease_factor != null ? Number(memo.ease_factor) : 2.5,
    // Read persisted interval — default to 1 day for the first session
    intervalDays:   memo.interval_days   ?? 1,
    nextReviewAt:   memo.next_review_at  ?? null,
    lastReviewedAt: memo.last_reviewed_at ?? null,
    stage:          memo.stage,
  };

  const sm2Settings = {
    initialRepetitions:   settings.initial_reps ?? 33,
    reinforceRepetitions: settings.reinforce_reps ?? 5,
    reviewRepetitions:    settings.revision_reps  ?? 30,
    masteryThreshold:     settings.revision_reps  ?? 30, // same threshold
  };

  const result = calculateNextReview(sm2State, q as 0|1|2|3, sm2Settings);

  return {
    review_count:     result.reviewCount,
    next_review_at:   result.nextReviewAt ?? tomorrow.toISOString(),
    last_reviewed_at: result.lastReviewedAt ?? now.toISOString(),
    stage:            result.stage as Memo['stage'],
    ease_factor:      result.easeFactor,
    interval_days:    result.intervalDays,
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

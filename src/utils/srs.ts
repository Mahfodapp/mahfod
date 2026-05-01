export const SM2_DEFAULT_EF = 2.5;
export const SM2_MIN_EF = 1.3;

export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SRSCard {
  id: string;
  reviewCount: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
}

function toISODate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function createInitialSRSCard(id: string): SRSCard {
  return {
    id,
    reviewCount: 0,
    easeFactor: SM2_DEFAULT_EF,
    intervalDays: 0,
    nextReviewAt: null,
    lastReviewedAt: null,
  };
}

export function isDueToday(nextReviewAt: string | null): boolean {
  if (!nextReviewAt) return true;
  const today = toISODate(Date.now());
  return nextReviewAt <= today;
}

export function computeNextReview(card: SRSCard, quality: RecallQuality) {
  const q = Math.max(0, Math.min(5, quality));
  const now = Date.now();

  let newReviewCount = card.reviewCount;
  let newIntervalDays = card.intervalDays;
  let newEaseFactor = card.easeFactor;

  // SM-2 EF formula
  const adjustedEF = Math.max(
    SM2_MIN_EF,
    card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );
  newEaseFactor = adjustedEF;

  if (q < 3) {
    newReviewCount = 0;
    newIntervalDays = 1;
  } else if (card.reviewCount === 0) {
    newReviewCount = 1;
    newIntervalDays = 1;
  } else if (card.reviewCount === 1) {
    newReviewCount = 2;
    newIntervalDays = 6;
  } else {
    newReviewCount = card.reviewCount + 1;
    newIntervalDays = Math.max(1, Math.round(card.intervalDays * newEaseFactor));
  }

  const nextReviewAt = toISODate(now + newIntervalDays * 86_400_000);
  const lastReviewedAt = toISODate(now);

  return {
    newReviewCount,
    newIntervalDays,
    newEaseFactor,
    nextReviewAt,
    lastReviewedAt,
  };
}

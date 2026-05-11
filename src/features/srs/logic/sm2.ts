export type Stage = 'LEARNING' | 'REVISION' | 'MASTERED';

export interface SM2State {
  reviewCount: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  stage: Stage;
}

export interface Settings {
  initialRepetitions: number;
  reinforceRepetitions: number;
  reviewRepetitions: number;
  masteryThreshold: number;
}

/** quality: 0 = forgot, 1 = hard, 2 = ok, 3 = easy */
export function calculateNextReview(
  state: SM2State,
  quality: 0 | 1 | 2 | 3,
  settings: Settings
): SM2State {
  const MIN_EF = 1.3;
  let { easeFactor, intervalDays, reviewCount } = state;

  if (quality < 2) {
    intervalDays = 1;
  } else {
    if (reviewCount === 0) intervalDays = 1;
    else if (reviewCount === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);

    easeFactor = Math.max(
      MIN_EF,
      easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
    );
  }

  reviewCount += 1;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);

  let stage: Stage = state.stage;
  if (stage === 'LEARNING' && reviewCount >= settings.initialRepetitions) {
    stage = 'REVISION';
  }
  if (stage === 'REVISION' && reviewCount >= settings.masteryThreshold) {
    stage = 'MASTERED';
  }

  return {
    reviewCount,
    easeFactor,
    intervalDays,
    nextReviewAt: nextDate.toISOString(),
    lastReviewedAt: new Date().toISOString(),
    stage,
  };
}

export function isDueForReview(memo: SM2State): boolean {
  if (!memo.nextReviewAt) return true;
  return new Date(memo.nextReviewAt) <= new Date();
}

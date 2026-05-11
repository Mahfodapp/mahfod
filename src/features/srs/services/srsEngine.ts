/**
 * SuperMemo-2 (SM-2) Algorithm Implementation
 * Extracted from the state store to provide a clean, testable SRS engine.
 */

export interface SRSResult {
  interval: number;
  easeFactor: number;
  consecutiveDays: number;
  nextReviewAt: string;
}

export interface SRSMemoState {
  interval: number;
  easeFactor: number;
  consecutiveDays: number;
  stage: 'LEARNING' | 'REVIEW' | 'MASTERED';
}

export const processSM2 = (
  memo: SRSMemoState,
  quality: number, // 0-5 (0=Blackout, 1=Wrong, 2=Hard, 3=Good, 4=Easy, 5=Perfect)
  revisionDaysLimit: number = 30
): SRSResult & { newStage: 'LEARNING' | 'REVIEW' | 'MASTERED' } => {
  
  let easeFactor = memo.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  
  let interval = memo.interval;
  let consecutiveDays = memo.consecutiveDays;
  let newStage = memo.stage;

  if (quality >= 3) { // Success (Hard, Good, Easy)
    if (memo.stage === 'REVIEW') {
      consecutiveDays += 1;
      interval = 1; // Everyday for the initial revision phase
      
      if (consecutiveDays >= revisionDaysLimit) {
        newStage = 'MASTERED';
        interval = Math.round(memo.interval * easeFactor);
        if (interval === 1) interval = 2; // jump interval
      }
    } else if (memo.stage === 'MASTERED') {
      interval = Math.round(memo.interval * easeFactor);
    }
  } else {
    // Failure (Wrong/Blackout)
    consecutiveDays = 0;
    interval = 1;
    if (memo.stage === 'MASTERED') {
      newStage = 'REVIEW'; // Demote back to review
    }
  }

  const nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

  return {
    interval,
    easeFactor,
    consecutiveDays,
    nextReviewAt,
    newStage
  };
};

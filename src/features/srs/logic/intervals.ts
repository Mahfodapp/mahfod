import { MemoStage, UserSettings } from '../../../types';

export function getNextStage(
  currentStage: MemoStage,
  repetitionCount: number,
  reviewCount: number,
  settings: UserSettings
): MemoStage {
  if (currentStage === 'LEARNING' && repetitionCount >= settings.initial_reps) {
    return 'REVISION';
  }
  if (currentStage === 'REVISION' && reviewCount >= settings.review_days) {
    return 'MASTERED';
  }
  return currentStage;
}

export function getNextReviewDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

export function isDueToday(nextReviewAt: string | null): boolean {
  if (!nextReviewAt) return true;
  return new Date(nextReviewAt) <= new Date();
}

export function getDayNumber(lastReviewedAt: string | null, createdAt: string): number {
  if (!createdAt) return 1;
  const start = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays || 1;
}

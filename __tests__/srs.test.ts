/**
 * __tests__/srs.test.ts
 * Unit tests for the SM-2 spaced repetition algorithm.
 */

import { computeNextReview, isDueToday, createInitialSRSCard, SM2_DEFAULT_EF, SM2_MIN_EF } from '../src/utils/srs';
import type { SRSCard, RecallQuality } from '../src/utils/srs';

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);

function makeCard(overrides: Partial<SRSCard> = {}): SRSCard {
    return {
        id: 'test-id',
        reviewCount: 0,
        easeFactor: SM2_DEFAULT_EF,
        intervalDays: 0,
        nextReviewAt: null,
        lastReviewedAt: null,
        ...overrides,
    };
}

describe('computeNextReview', () => {
    it('resets interval on failed recall (quality < 3)', () => {
        const card = makeCard({ reviewCount: 5, intervalDays: 30 });
        const result = computeNextReview(card, 0 as RecallQuality);
        expect(result.newIntervalDays).toBe(1);
        expect(result.newReviewCount).toBe(0);
    });

    it('advances interval to 1 day on first successful review', () => {
        const card = makeCard({ reviewCount: 0, intervalDays: 0 });
        const result = computeNextReview(card, 4 as RecallQuality);
        expect(result.newIntervalDays).toBe(1);
        expect(result.newReviewCount).toBe(1);
    });

    it('advances interval to 6 days on second successful review', () => {
        const card = makeCard({ reviewCount: 1, intervalDays: 1 });
        const result = computeNextReview(card, 5 as RecallQuality);
        expect(result.newIntervalDays).toBe(6);
        expect(result.newReviewCount).toBe(2);
    });

    it('uses EF to compute interval from 3rd review onwards', () => {
        const ef = 2.5;
        const card = makeCard({ reviewCount: 2, intervalDays: 6, easeFactor: ef });
        const result = computeNextReview(card, 5 as RecallQuality);
        // Algorithm uses the UPDATED easeFactor (after quality adjustment) to scale the interval
        expect(result.newIntervalDays).toBe(Math.round(6 * result.newEaseFactor));
    });

    it('lowers EF on borderline recall (quality 3)', () => {
        const card = makeCard({ reviewCount: 3, intervalDays: 6, easeFactor: 2.5 });
        const result = computeNextReview(card, 3 as RecallQuality);
        expect(result.newEaseFactor).toBeLessThan(2.5);
    });

    it('does not allow EF to drop below SM2_MIN_EF', () => {
        const card = makeCard({ easeFactor: SM2_MIN_EF + 0.01, reviewCount: 3, intervalDays: 6 });
        const result = computeNextReview(card, 0 as RecallQuality);
        expect(result.newEaseFactor).toBeGreaterThanOrEqual(SM2_MIN_EF);
    });

    it('returns a nextReviewAt date in ISO format', () => {
        const card = makeCard();
        const result = computeNextReview(card, 5 as RecallQuality);
        expect(result.nextReviewAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('nextReviewAt is at least today', () => {
        const card = makeCard();
        const result = computeNextReview(card, 5 as RecallQuality);
        expect(result.nextReviewAt >= today).toBe(true);
    });
});

describe('isDueToday', () => {
    it('returns true when nextReviewAt is null', () => {
        expect(isDueToday(null)).toBe(true);
    });

    it('returns true when nextReviewAt is today', () => {
        expect(isDueToday(today)).toBe(true);
    });

    it('returns true when nextReviewAt is in the past', () => {
        expect(isDueToday(yesterday)).toBe(true);
        expect(isDueToday(twoDaysAgo)).toBe(true);
    });

    it('returns false when nextReviewAt is in the future', () => {
        expect(isDueToday(tomorrow)).toBe(false);
    });
});

describe('createInitialSRSCard', () => {
    it('creates a card with correct defaults', () => {
        const card = createInitialSRSCard('abc');
        expect(card.id).toBe('abc');
        expect(card.easeFactor).toBe(SM2_DEFAULT_EF);
        expect(card.reviewCount).toBe(0);
        expect(card.intervalDays).toBe(0);
        expect(card.nextReviewAt).toBeNull();
    });
});

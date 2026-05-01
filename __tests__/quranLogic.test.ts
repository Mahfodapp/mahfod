/**
 * Unit tests for Quran review queue business logic.
 * Tests the getTodayReviewQueue algorithm in isolation.
 */

// ── Pure function mirrored from useQuranStore ─────────────────────────────

function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

function getTodayReviewQueue(
    memorizedThumns: number[],
    reviewLog: Record<number, string>,
    dailyReviewCount: number,
): number[] {
    const today = todayStr();
    return memorizedThumns
        .filter(id => (reviewLog[id] ?? '').slice(0, 10) !== today)
        .sort((a, b) => {
            const da = reviewLog[a] ?? '1970-01-01';
            const db = reviewLog[b] ?? '1970-01-01';
            return da < db ? -1 : 1;
        })
        .slice(0, dailyReviewCount);
}

// ── Test data ─────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString();
const YESTERDAY = new Date(Date.now() - 86400000).toISOString();
const WEEK_AGO = new Date(Date.now() - 7 * 86400000).toISOString();
const MONTH_AGO = new Date(Date.now() - 30 * 86400000).toISOString();

// ── Tests ─────────────────────────────────────────────────────────────────

describe('📖 getTodayReviewQueue', () => {

    it('excludes thumns reviewed today', () => {
        const memorized = [1, 2, 3];
        const reviewLog = {
            1: TODAY,    // reviewed today → excluded
            2: YESTERDAY,
            3: WEEK_AGO,
        };
        const result = getTodayReviewQueue(memorized, reviewLog, 10);
        expect(result).not.toContain(1);
        expect(result).toContain(2);
        expect(result).toContain(3);
    });

    it('prioritizes thumns reviewed longest ago', () => {
        const memorized = [1, 2, 3];
        const reviewLog = {
            1: YESTERDAY,
            2: MONTH_AGO,
            3: WEEK_AGO,
        };
        const result = getTodayReviewQueue(memorized, reviewLog, 10);
        // Month ago should come first, then week ago, then yesterday
        expect(result[0]).toBe(2);
        expect(result[1]).toBe(3);
        expect(result[2]).toBe(1);
    });

    it('includes never-reviewed thumns (sorted before reviewed ones)', () => {
        const memorized = [1, 2];
        const reviewLog = {
            1: YESTERDAY,
            // 2 has never been reviewed
        };
        const result = getTodayReviewQueue(memorized, reviewLog, 10);
        expect(result[0]).toBe(2); // Never reviewed → 1970 → comes first
        expect(result[1]).toBe(1);
    });

    it('respects dailyReviewCount limit', () => {
        const memorized = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const reviewLog = {};
        const result = getTodayReviewQueue(memorized, reviewLog, 5);
        expect(result).toHaveLength(5);
    });

    it('returns empty array when all thumns reviewed today', () => {
        const memorized = [1, 2];
        const reviewLog = { 1: TODAY, 2: TODAY };
        const result = getTodayReviewQueue(memorized, reviewLog, 10);
        expect(result).toHaveLength(0);
    });

    it('returns empty array when no thumns are memorized', () => {
        const result = getTodayReviewQueue([], {}, 8);
        expect(result).toHaveLength(0);
    });
});

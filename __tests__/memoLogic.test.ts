/**
 * Unit tests for Memo SRS (Spaced Repetition System) business logic.
 * Tests the core algorithms in isolation — no React, no DB, no native modules.
 */

// ── Types (mirrored from useMemoStore) ────────────────────────────────────
type MemoStage = 'LEARNING' | 'REVIEWING' | 'MASTERED';

interface Memo {
    id: string;
    title: string;
    text: string;
    label: string;
    stage: MemoStage;
    reviewCount: number;
    lastReviewedAt: string | null;
    createdAt: string;
}

// ── Pure functions extracted from store logic ─────────────────────────────

function isToday(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const today = new Date().toISOString().slice(0, 10);
    return dateStr.slice(0, 10) === today;
}

function daysSince(dateStr: string | null): number {
    if (!dateStr) return 999;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function getTodayReviewMemos(memos: Memo[]): Memo[] {
    return memos.filter(m => {
        if (m.stage !== 'REVIEWING') return false;
        return !isToday(m.lastReviewedAt);
    });
}

function completeReview(memo: Memo, masteryThreshold: number): Memo {
    const newCount = memo.reviewCount + 1;
    const stage: MemoStage = newCount >= masteryThreshold ? 'MASTERED' : 'REVIEWING';
    return { ...memo, reviewCount: newCount, stage, lastReviewedAt: new Date().toISOString() };
}

function completeLearning(memo: Memo): Memo {
    return { ...memo, stage: 'REVIEWING', lastReviewedAt: null };
}

function getRandomTestMemos(memos: Memo[]): Memo[] {
    const mastered = memos.filter(m => m.stage === 'MASTERED');
    const arr = [...mastered];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ── Test data ─────────────────────────────────────────────────────────────

function makeMemo(overrides: Partial<Memo> & { id: string }): Memo {
    return {
        title: 'Test Memo',
        text: 'Some text',
        label: 'متن',
        stage: 'LEARNING',
        reviewCount: 0,
        lastReviewedAt: null,
        createdAt: new Date().toISOString(),
        ...overrides,
    };
}

const yesterday = new Date(Date.now() - 86400000).toISOString();
const today = new Date().toISOString();

// ── Tests ─────────────────────────────────────────────────────────────────

describe('🗓️ getTodayReviewMemos', () => {
    it('returns REVIEWING memos not reviewed today', () => {
        const memos = [
            makeMemo({ id: '1', stage: 'REVIEWING', lastReviewedAt: yesterday }),
            makeMemo({ id: '2', stage: 'REVIEWING', lastReviewedAt: null }),
        ];
        const result = getTodayReviewMemos(memos);
        expect(result).toHaveLength(2);
    });

    it('excludes REVIEWING memos already reviewed today', () => {
        const memos = [
            makeMemo({ id: '1', stage: 'REVIEWING', lastReviewedAt: today }),
            makeMemo({ id: '2', stage: 'REVIEWING', lastReviewedAt: yesterday }),
        ];
        const result = getTodayReviewMemos(memos);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
    });

    it('excludes LEARNING and MASTERED memos entirely', () => {
        const memos = [
            makeMemo({ id: '1', stage: 'LEARNING' }),
            makeMemo({ id: '2', stage: 'MASTERED', lastReviewedAt: yesterday }),
        ];
        const result = getTodayReviewMemos(memos);
        expect(result).toHaveLength(0);
    });
});


describe('⬆️ completeLearning', () => {
    it('moves memo from LEARNING to REVIEWING', () => {
        const memo = makeMemo({ id: '1', stage: 'LEARNING' });
        const result = completeLearning(memo);
        expect(result.stage).toBe('REVIEWING');
    });

    it('resets lastReviewedAt to null so it appears in tomorrow queue', () => {
        const memo = makeMemo({ id: '1', stage: 'LEARNING' });
        const result = completeLearning(memo);
        expect(result.lastReviewedAt).toBeNull();
    });
});


describe('🎯 completeReview', () => {
    const THRESHOLD = 30;

    it('increments reviewCount by 1', () => {
        const memo = makeMemo({ id: '1', stage: 'REVIEWING', reviewCount: 5 });
        const result = completeReview(memo, THRESHOLD);
        expect(result.reviewCount).toBe(6);
    });

    it('stays in REVIEWING if below mastery threshold', () => {
        const memo = makeMemo({ id: '1', stage: 'REVIEWING', reviewCount: 10 });
        const result = completeReview(memo, THRESHOLD);
        expect(result.stage).toBe('REVIEWING');
    });

    it('promotes to MASTERED when reaching threshold', () => {
        const memo = makeMemo({ id: '1', stage: 'REVIEWING', reviewCount: THRESHOLD - 1 });
        const result = completeReview(memo, THRESHOLD);
        expect(result.stage).toBe('MASTERED');
        expect(result.reviewCount).toBe(THRESHOLD);
    });

    it('sets lastReviewedAt to today after review', () => {
        const memo = makeMemo({ id: '1', stage: 'REVIEWING', reviewCount: 0 });
        const result = completeReview(memo, THRESHOLD);
        expect(result.lastReviewedAt).not.toBeNull();
        expect(result.lastReviewedAt!.slice(0, 10)).toBe(new Date().toISOString().slice(0, 10));
    });
});


describe('🎲 getRandomTestMemos', () => {
    it('only returns MASTERED memos', () => {
        const memos = [
            makeMemo({ id: '1', stage: 'MASTERED' }),
            makeMemo({ id: '2', stage: 'REVIEWING' }),
            makeMemo({ id: '3', stage: 'LEARNING' }),
            makeMemo({ id: '4', stage: 'MASTERED' }),
        ];
        const result = getRandomTestMemos(memos);
        expect(result).toHaveLength(2);
        result.forEach(m => expect(m.stage).toBe('MASTERED'));
    });

    it('returns an empty array when no MASTERED memos exist', () => {
        const memos = [makeMemo({ id: '1', stage: 'REVIEWING' })];
        const result = getRandomTestMemos(memos);
        expect(result).toHaveLength(0);
    });
});


describe('📅 daysSince helper', () => {
    it('returns 999 for null dates', () => {
        expect(daysSince(null)).toBe(999);
    });

    it('returns 0 for today', () => {
        expect(daysSince(new Date().toISOString())).toBe(0);
    });

    it('returns 1 for yesterday', () => {
        const yest = new Date(Date.now() - 86400000).toISOString();
        expect(daysSince(yest)).toBe(1);
    });
});

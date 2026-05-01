/**
 * __tests__/offlineQueue.test.ts
 * Unit tests for the offline sync queue: deduplication and exponential backoff.
 *
 * NOTE: These tests mock AsyncStorage so no real storage is touched.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueueSync, flushSyncQueue, getPendingCount, clearSyncQueue } from '../src/services/offlineQueue';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock supabase (not testing the network layer here)
jest.mock('../src/services/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: jest.fn(() => ({ data: null })) })) })) })),
            upsert: jest.fn(() => ({ error: null })),
            delete: jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })) })),
        })),
    },
}));

const TEST_USER = 'user-test-123';

beforeEach(async () => {
    await clearSyncQueue();
    jest.clearAllMocks();
});

describe('enqueueSync — deduplication', () => {
    it('adds a single op to the queue', async () => {
        await enqueueSync('upsert', 'memos', { id: 'memo-1', title: 'Test' }, TEST_USER);
        const count = await getPendingCount();
        expect(count).toBe(1);
    });

    it('replaces existing op for the same entity on duplicate upsert', async () => {
        await enqueueSync('upsert', 'memos', { id: 'memo-1', title: 'Original' }, TEST_USER);
        await enqueueSync('upsert', 'memos', { id: 'memo-1', title: 'Updated' }, TEST_USER);
        const count = await getPendingCount();
        // Should still be 1, not 2
        expect(count).toBe(1);
    });

    it('does NOT deduplicate ops for different entity IDs', async () => {
        await enqueueSync('upsert', 'memos', { id: 'memo-1' }, TEST_USER);
        await enqueueSync('upsert', 'memos', { id: 'memo-2' }, TEST_USER);
        const count = await getPendingCount();
        expect(count).toBe(2);
    });

    it('does NOT deduplicate upsert vs delete for the same ID', async () => {
        await enqueueSync('upsert', 'memos', { id: 'memo-1' }, TEST_USER);
        await enqueueSync('delete', 'memos', { id: 'memo-1' }, TEST_USER);
        const count = await getPendingCount();
        expect(count).toBe(2);
    });
});

describe('enqueueSync — multiple tables', () => {
    it('does not deduplicate across different tables', async () => {
        await enqueueSync('upsert', 'memos', { id: 'entity-1' }, TEST_USER);
        await enqueueSync('upsert', 'books', { id: 'entity-1' }, TEST_USER);
        const count = await getPendingCount();
        expect(count).toBe(2);
    });
});

describe('clearSyncQueue', () => {
    it('empties the queue', async () => {
        await enqueueSync('upsert', 'memos', { id: 'memo-1' }, TEST_USER);
        await clearSyncQueue();
        const count = await getPendingCount();
        expect(count).toBe(0);
    });
});

describe('flushSyncQueue — backoff', () => {
    it('does not retry ops that are still in backoff period', async () => {
        // Manually insert a future-deferred op
        const futureOp = {
            id: 'op-1', table: 'memos', action: 'upsert', payload: { id: 'm1' },
            userId: TEST_USER,
            createdAt: new Date().toISOString(),
            retries: 1,
            attemptAt: new Date(Date.now() + 30_000).toISOString(), // 30 seconds in future
        };
        await AsyncStorage.setItem('mahfod_sync_queue', JSON.stringify([futureOp]));

        const result = await flushSyncQueue();
        expect(result.flushed).toBe(0);
        expect(result.failed).toBe(0);
        // Op should still be in queue
        expect(await getPendingCount()).toBe(1);
    });
});

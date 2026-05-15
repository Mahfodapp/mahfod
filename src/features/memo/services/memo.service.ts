import { db } from '../../../infrastructure/db/client';
import { memos } from '../../../infrastructure/db/schema';
import { Memo } from '../../../types';
import { nanoid } from 'nanoid/non-secure';
import { supabase } from '../../../lib/supabase';
import { enqueueSync } from '../../sync/offlineQueue';
import { eq, desc, and, or, isNull, lte, count } from 'drizzle-orm';

// ── Constants ────────────────────────────────────────────────────────────────

const GUEST_USER_ID = 'guest-local';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(tags: any): string[] {
  if (typeof tags === 'string') {
    try { return JSON.parse(tags); } catch { return []; }
  }
  if (Array.isArray(tags)) return tags;
  return [];
}

/**
 * Returns the current user_id, falling back to 'guest-local' for guest mode.
 * Offline-first: never blocks UI if auth is unavailable.
 */
async function getUserId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) return data.user.id;
  } catch {
    // Auth unavailable — use guest
  }
  return GUEST_USER_ID;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getMemos(filters?: { stage?: string; label?: string; search?: string }): Promise<Memo[]> {
  const userId = await getUserId();

  let conditions: any[] = [eq(memos.user_id, userId), eq(memos.deleted, false)];

  if (filters?.stage) {
    conditions.push(eq(memos.stage, filters.stage));
  }
  if (filters?.label) {
    conditions.push(eq(memos.label, filters.label));
  }

  const results = await db.select().from(memos).where(and(...conditions)).orderBy(desc(memos.created_at));

  // Client-side search filter (more reliable than ilike for SQLite)
  let filtered = results;
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = results.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.text.toLowerCase().includes(q) ||
      (r.label && r.label.toLowerCase().includes(q))
    );
  }

  return filtered.map(r => ({
    ...r,
    tags: parseTags(r.tags),
  })) as Memo[];
}

// ── Paginated variant ─────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

/**
 * Returns total count of non-deleted memos for the current user,
 * optionally filtered by stage / label / search.
 */
export async function getMemosCount(
  filters?: { stage?: string; label?: string; search?: string },
): Promise<number> {
  const userId = await getUserId();

  // For search we can't do an exact DB count, so fall back to full query
  if (filters?.search) {
    const all = await getMemos(filters);
    return all.length;
  }

  let conditions: any[] = [eq(memos.user_id, userId), eq(memos.deleted, false)];
  if (filters?.stage) conditions.push(eq(memos.stage, filters.stage));
  if (filters?.label) conditions.push(eq(memos.label, filters.label));

  const result = await db
    .select({ total: count() })
    .from(memos)
    .where(and(...conditions))
    .get();

  return result?.total ?? 0;
}

/**
 * Returns a single page of memos (LIMIT / OFFSET at the DB level).
 * Pages are 0-indexed.
 */
export async function getMemosPage(
  page: number,
  filters?: { stage?: string; label?: string; search?: string },
  pageSize: number = PAGE_SIZE,
): Promise<Memo[]> {
  const userId = await getUserId();

  // For search we have to do the full query then slice (SQLite has no ILIKE)
  if (filters?.search) {
    const all = await getMemos(filters);
    return all.slice(page * pageSize, (page + 1) * pageSize);
  }

  let conditions: any[] = [eq(memos.user_id, userId), eq(memos.deleted, false)];
  if (filters?.stage) conditions.push(eq(memos.stage, filters.stage));
  if (filters?.label) conditions.push(eq(memos.label, filters.label));

  const results = await db
    .select()
    .from(memos)
    .where(and(...conditions))
    .orderBy(desc(memos.created_at))
    .limit(pageSize)
    .offset(page * pageSize);

  return results.map(r => ({ ...r, tags: parseTags(r.tags) })) as Memo[];
}

export async function getMemoById(id: string): Promise<Memo> {
  const result = await db.select().from(memos).where(eq(memos.id, id)).get();
  if (!result) throw new Error('Memo not found');
  return { ...result, tags: parseTags(result.tags) } as Memo;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function addMemo(data: Omit<Memo, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Memo> {
  const userId = await getUserId();

  const id  = nanoid();
  const now = new Date().toISOString();
  
  const newRecord = {
    id,
    user_id: userId,
    ...data,
    tags: JSON.stringify(data.tags || []),
    created_at: now,
    updated_at: now,
    deleted: false,
  };

  // 1. Insert into local SQLite immediately
  await db.insert(memos).values(newRecord as any);

  // 2. Queue for background sync to Supabase (skip for guest)
  if (userId !== GUEST_USER_ID) {
    await enqueueSync('upsert', 'memos', newRecord, userId);
  }

  return { ...newRecord, tags: data.tags } as Memo;
}

export async function updateMemo(id: string, data: Partial<Memo>): Promise<Memo> {
  const now = new Date().toISOString();
  const updateData: any = { ...data, updated_at: now };
  if (data.tags) {
    updateData.tags = JSON.stringify(data.tags);
  }

  // 1. Update local SQLite
  await db.update(memos).set(updateData).where(eq(memos.id, id));

  // 2. Fetch full updated record for sync queue
  const updatedRecord = await db.select().from(memos).where(eq(memos.id, id)).get();
  if (!updatedRecord) throw new Error('Memo not found during update');

  // 3. Queue for background sync (skip for guest)
  if (updatedRecord.user_id && updatedRecord.user_id !== GUEST_USER_ID) {
    await enqueueSync('upsert', 'memos', updatedRecord, updatedRecord.user_id);
  }

  return { ...updatedRecord, tags: parseTags(updatedRecord.tags) } as Memo;
}

export async function deleteMemo(id: string): Promise<void> {
  // Soft delete locally
  await db.update(memos).set({ deleted: true, updated_at: new Date().toISOString() }).where(eq(memos.id, id));
  
  const record = await db.select().from(memos).where(eq(memos.id, id)).get();
  if (record && record.user_id && record.user_id !== GUEST_USER_ID) {
    // Queue delete operation (skip for guest)
    await enqueueSync('delete', 'memos', { id }, record.user_id);
  }
}

export async function toggleFavorite(id: string, current: boolean): Promise<Memo> {
  return updateMemo(id, { is_favorite: !current });
}

// ── Review Queries ───────────────────────────────────────────────────────────

export async function getMemosDueToday(): Promise<Memo[]> {
  const userId = await getUserId();
  const now = new Date().toISOString();
  
  // Local fetch for fast UI
  const results = await db.select().from(memos)
    .where(and(
      eq(memos.user_id, userId),
      eq(memos.stage, 'REVISION'),
      eq(memos.deleted, false),
      or(isNull(memos.next_review_at), lte(memos.next_review_at, now))
    ));

  return results.map(r => ({ ...r, tags: parseTags(r.tags) })) as Memo[];
}

/**
 * Records one successful repetition for a LEARNING-stage memo.
 * Called only from LearningSessionScreen — REVISION memos use applyRevision instead.
 */
export async function recordRepetition(id: string, currentCount: number, initialReps: number): Promise<Memo> {
  const memo = await getMemoById(id);
  const newCount = currentCount + 1;
  let updates: Partial<Memo> = { repetition_count: newCount };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Graduate LEARNING → REVISION once target reps reached
  if (memo.stage === 'LEARNING' && newCount >= initialReps) {
    updates.stage           = 'REVISION';
    updates.next_review_at  = tomorrow.toISOString();
    updates.repetition_count = 0;  // reset learning count, review_count starts from 0
  }
  // NOTE: do NOT handle REVISION here — that belongs to applyRevision() in revisionEngine.ts

  return updateMemo(id, updates);
}

export async function getMasteredMemos(): Promise<Memo[]> {
  const userId = await getUserId();

  const results = await db.select().from(memos)
    .where(and(
      eq(memos.user_id, userId),
      eq(memos.stage, 'MASTERED'),
      eq(memos.deleted, false)
    ));

  const shuffled = results.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10).map(r => ({ ...r, tags: parseTags(r.tags) })) as Memo[];
}

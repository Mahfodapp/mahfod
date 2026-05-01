import { db } from '../db/client';
import { memos } from '../db/schema';
import { Memo } from '../types';
import * as Crypto from 'expo-crypto';
import { supabase } from '../lib/supabase';
import { enqueueSync } from './offlineQueue';
import { eq, desc, ilike, and, or, isNull, lte } from 'drizzle-orm';

function parseTags(tags: any): string[] {
  if (typeof tags === 'string') {
    try { return JSON.parse(tags); } catch { return []; }
  }
  if (Array.isArray(tags)) return tags;
  return [];
}

export async function getMemos(filters?: { stage?: string; label?: string; search?: string }): Promise<Memo[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  let conditions: any[] = [eq(memos.user_id, userData.user.id), eq(memos.deleted, false)];

  if (filters?.stage) {
    conditions.push(eq(memos.stage, filters.stage));
  }
  if (filters?.label) {
    conditions.push(eq(memos.label, filters.label));
  }
  if (filters?.search) {
    conditions.push(ilike(memos.title, `%${filters.search}%`));
  }

  const results = await db.select().from(memos).where(and(...conditions)).orderBy(desc(memos.created_at));

  return results.map(r => ({
    ...r,
    tags: parseTags(r.tags),
  })) as Memo[];
}

export async function getMemoById(id: string): Promise<Memo> {
  const result = await db.select().from(memos).where(eq(memos.id, id)).get();
  if (!result) throw new Error('Memo not found');
  return { ...result, tags: parseTags(result.tags) } as Memo;
}

export async function addMemo(data: Omit<Memo, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Memo> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not logged in');

  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newRecord = {
    id,
    user_id: userData.user.id,
    ...data,
    tags: JSON.stringify(data.tags || []),
    created_at: now,
    updated_at: now,
    deleted: false,
  };

  // 1. Insert into local SQLite immediately
  await db.insert(memos).values(newRecord as any);

  // 2. Queue for background sync to Supabase
  await enqueueSync('upsert', 'memos', newRecord, userData.user.id);

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

  // 3. Queue for background sync
  if (updatedRecord.user_id) {
    await enqueueSync('upsert', 'memos', updatedRecord, updatedRecord.user_id);
  }

  return { ...updatedRecord, tags: parseTags(updatedRecord.tags) } as Memo;
}

export async function deleteMemo(id: string): Promise<void> {
  // Soft delete locally
  await db.update(memos).set({ deleted: true, updated_at: new Date().toISOString() }).where(eq(memos.id, id));
  
  const record = await db.select().from(memos).where(eq(memos.id, id)).get();
  if (record && record.user_id) {
    // Queue delete operation
    await enqueueSync('delete', 'memos', { id }, record.user_id);
  }
}

export async function toggleFavorite(id: string, current: boolean): Promise<Memo> {
  return updateMemo(id, { is_favorite: !current });
}

export async function getMemosDueToday(): Promise<Memo[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const now = new Date().toISOString();
  
  // Local fetch for fast UI
  const results = await db.select().from(memos)
    .where(and(
      eq(memos.user_id, userData.user.id),
      eq(memos.stage, 'REVIEWING'),
      eq(memos.deleted, false),
      or(isNull(memos.next_review_at), lte(memos.next_review_at, now))
    ));

  return results.map(r => ({ ...r, tags: parseTags(r.tags) })) as Memo[];
}

export async function recordRepetition(id: string, currentCount: number, initialReps: number): Promise<Memo> {
  const memo = await getMemoById(id);
  const newCount = currentCount + 1;
  let updates: Partial<Memo> = { repetition_count: newCount };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (newCount >= initialReps && memo.stage === 'LEARNING') {
    updates.stage = 'REVIEWING';
    updates.next_review_at = tomorrow.toISOString();
    updates.repetition_count = 0;
  } else if (memo.stage === 'REVIEWING') {
    updates.next_review_at = tomorrow.toISOString();
    updates.review_count = memo.review_count + 1;
  }

  return updateMemo(id, updates);
}

export async function getMasteredMemos(): Promise<Memo[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const results = await db.select().from(memos)
    .where(and(
      eq(memos.user_id, userData.user.id),
      eq(memos.stage, 'MASTERED'),
      eq(memos.deleted, false)
    ));

  const shuffled = results.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10).map(r => ({ ...r, tags: parseTags(r.tags) })) as Memo[];
}

/**
 * Supabase sync queue — offline-first: write SQLite first, enqueue remote ops here.
 * Implemented in Phase 5 per recovery build order.
 */
export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncQueueItem {
  id: string;
  tableName: string;
  recordId: string;
  operation: SyncOperation;
  payload: string;
  createdAt: string;
}

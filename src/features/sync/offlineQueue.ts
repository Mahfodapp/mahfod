import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../infrastructure/api/supabase';
import * as Crypto from 'expo-crypto';

export interface SyncOp {
  operationId: string;
  entityType: string;
  entityId: string;
  action: 'upsert' | 'delete';
  payload: any;
  baseVersion: number;
  newVersion: number;
  deviceId: string;
  userId: string;
  timestamp: string;
  retries: number;
  attemptAt?: string;
}

const QUEUE_KEY = 'mahfod_sync_queue';

let debounceTimer: NodeJS.Timeout | null = null;

export function debouncedFlushSyncQueue() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    flushSyncQueue().catch(console.error);
  }, 2500); // 2.5 seconds debounce
}

export async function enqueueSync(
  action: 'upsert' | 'delete', 
  table: string, 
  payload: any, 
  userId: string,
  baseVersion: number = 0,
  newVersion: number = 1,
  deviceId: string = 'local-device'
) {
  const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
  let queue: SyncOp[] = queueJson ? JSON.parse(queueJson) : [];

  // Deduplication logic: Keep the highest newVersion for upserts of the same entity
  queue = queue.filter(op => {
    if (op.entityType === table && op.entityId === payload.id) {
      if (op.action === 'upsert' && action === 'upsert') return false; 
    }
    return true;
  });

  const newOp: SyncOp = {
    operationId: Crypto.randomUUID(),
    entityType: table,
    entityId: payload.id,
    action,
    payload,
    baseVersion,
    newVersion,
    deviceId,
    userId,
    timestamp: new Date().toISOString(),
    retries: 0,
  };

  queue.push(newOp);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  
  // Trigger event-driven sync
  debouncedFlushSyncQueue();
}

export async function getPendingCount(): Promise<number> {
  const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
  if (!queueJson) return 0;
  const queue: SyncOp[] = JSON.parse(queueJson);
  return queue.length;
}

export async function clearSyncQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

let isFlushing = false;

export async function flushSyncQueue() {
  if (isFlushing) return { flushed: 0, failed: 0, locked: true };
  isFlushing = true;

  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueJson) return { flushed: 0, failed: 0 };
    
    const queue: SyncOp[] = JSON.parse(queueJson);
    const now = new Date().toISOString();
    
    const toProcess = queue.filter(op => !op.attemptAt || op.attemptAt <= now);
    let remaining = queue.filter(op => op.attemptAt && op.attemptAt > now);
    
    let flushed = 0;
    let failed = 0;

    for (const op of toProcess) {
      try {
        if (op.action === 'upsert') {
          // Push payload with full versioning tracking
          const { error } = await supabase.from(op.entityType).upsert({ 
            ...op.payload, 
            user_id: op.userId,
            version: op.newVersion,
            device_id: op.deviceId,
            last_modified_by: op.userId,
            updated_at: op.timestamp
          });
          if (error) throw error;
        } else if (op.action === 'delete') {
          // Soft delete to preserve vector clock / tombstone records for CRDT
          const { error } = await supabase.from(op.entityType)
            .update({ 
              deleted: true, 
              deleted_at: op.timestamp,
              version: op.newVersion,
              device_id: op.deviceId,
              last_modified_by: op.userId 
            })
            .eq('id', op.entityId)
            .eq('user_id', op.userId);
            
          if (error) throw error;
        }
        flushed++;
      } catch (e) {
        failed++;
        // Exponential backoff
        const nextAttemptDelay = Math.min(1000 * Math.pow(2, op.retries), 60000 * 60); // Max 1 hr
        remaining.push({
          ...op,
          retries: op.retries + 1,
          attemptAt: new Date(Date.now() + nextAttemptDelay).toISOString(),
        });
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return { flushed, failed };
  } finally {
    isFlushing = false;
  }
}

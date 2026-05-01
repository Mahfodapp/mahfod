import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import * as Crypto from 'expo-crypto';

export interface SyncOp {
  id: string;
  action: 'upsert' | 'delete';
  table: string;
  payload: any;
  userId: string;
  createdAt: string;
  retries: number;
  attemptAt?: string;
}

const QUEUE_KEY = 'mahfod_sync_queue';

export async function enqueueSync(action: 'upsert' | 'delete', table: string, payload: any, userId: string) {
  const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
  let queue: SyncOp[] = queueJson ? JSON.parse(queueJson) : [];

  // Deduplication
  queue = queue.filter(op => {
    if (op.table === table && op.payload.id === payload.id) {
      if (op.action === 'upsert' && action === 'upsert') return false; // replaced
    }
    return true;
  });

  const newOp: SyncOp = {
    id: Crypto.randomUUID(),
    action,
    table,
    payload,
    userId,
    createdAt: new Date().toISOString(),
    retries: 0,
  };

  queue.push(newOp);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
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

export async function flushSyncQueue() {
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
        const { error } = await supabase.from(op.table).upsert({ ...op.payload, user_id: op.userId });
        if (error) throw error;
      } else if (op.action === 'delete') {
        const { error } = await supabase.from(op.table).delete().eq('id', op.payload.id).eq('user_id', op.userId);
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
}

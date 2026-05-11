import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const rawDb = SQLite.openDatabaseSync('mahfod.db');
export const db = drizzle(rawDb, { schema });

async function tryExec(sql: string) {
  try {
    await rawDb.execAsync(sql);
  } catch (e) {
    // column/table already exists
  }
}

export async function initDatabase() {
  await rawDb.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS memos (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      label TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      related_memo_id TEXT,
      audio_url TEXT,
      image_url TEXT,
      stage TEXT NOT NULL DEFAULT 'LEARNING',
      review_count INTEGER NOT NULL DEFAULT 0,
      repetition_count INTEGER NOT NULL DEFAULT 0,
      ease_factor TEXT,
      interval_days INTEGER DEFAULT 1,
      next_review_at TEXT,
      last_reviewed_at TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_poem INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS noter_books (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'book',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS noter_chapters (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS noter_notes (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      chapter_id TEXT,
      user_id TEXT,
      text TEXT NOT NULL,
      note_type TEXT NOT NULL DEFAULT 'فكرة',
      page_ref TEXT DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      language TEXT NOT NULL DEFAULT 'ar',
      initial_reps INTEGER NOT NULL DEFAULT 33,
      review_days INTEGER NOT NULL DEFAULT 30,
      daily_review_count INTEGER NOT NULL DEFAULT 5,
      reinforce_reps INTEGER NOT NULL DEFAULT 5,
      daily_notif_enabled INTEGER NOT NULL DEFAULT 0,
      daily_notif_time TEXT NOT NULL DEFAULT '07:00',
      weekly_notif_enabled INTEGER NOT NULL DEFAULT 0,
      weekly_notif_time TEXT NOT NULL DEFAULT '20:00',
      categories TEXT NOT NULL DEFAULT '["متن","شعر","حديث","فقه","عقيدة"]',
      vanish_mode TEXT NOT NULL DEFAULT 'none'
    );

    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      attempts INTEGER DEFAULT 0
    );
  `);

  // ── memos columns ────────────────────────────────────────────────────────────
  const memoColumns = [
    'user_id TEXT',
    'audio_url TEXT',
    'image_url TEXT',
    'review_count INTEGER DEFAULT 0',
    'repetition_count INTEGER DEFAULT 0',
    'next_review_at TEXT',
    'last_reviewed_at TEXT',
    'is_favorite INTEGER NOT NULL DEFAULT 0',
    'is_poem INTEGER NOT NULL DEFAULT 0',
    'synced_at TEXT',
    'deleted INTEGER DEFAULT 0',
    'label TEXT NOT NULL DEFAULT ""',
    'tags TEXT NOT NULL DEFAULT "[]"',
    'related_memo_id TEXT',
    'stage TEXT NOT NULL DEFAULT "LEARNING"',
    // ── added in later schema revision ────────────────────────────────────────
    'deleted_at TEXT',
    'version INTEGER NOT NULL DEFAULT 1',
    'device_id TEXT',
    'last_modified_by TEXT',
    // ── SM-2 persistence (v2) ─────────────────────────────────────────────────
    'ease_factor TEXT',
    'interval_days INTEGER DEFAULT 1',
  ];

  for (const col of memoColumns) {
    await tryExec(`ALTER TABLE memos ADD COLUMN ${col};`);
  }

  // ── noter_books columns ───────────────────────────────────────────────────────
  const noterBookColumns = [
    'deleted_at TEXT',
    'version INTEGER NOT NULL DEFAULT 1',
    'device_id TEXT',
    'last_modified_by TEXT',
  ];
  for (const col of noterBookColumns) {
    await tryExec(`ALTER TABLE noter_books ADD COLUMN ${col};`);
  }

  // ── noter_chapters columns ────────────────────────────────────────────────────
  const noterChapterColumns = [
    'version INTEGER NOT NULL DEFAULT 1',
    'device_id TEXT',
    'last_modified_by TEXT',
    'deleted_at TEXT',
  ];
  for (const col of noterChapterColumns) {
    await tryExec(`ALTER TABLE noter_chapters ADD COLUMN ${col};`);
  }

  // ── noter_notes columns ───────────────────────────────────────────────────────
  const noterNoteColumns = [
    'deleted_at TEXT',
    'version INTEGER NOT NULL DEFAULT 1',
    'device_id TEXT',
    'last_modified_by TEXT',
  ];
  for (const col of noterNoteColumns) {
    await tryExec(`ALTER TABLE noter_notes ADD COLUMN ${col};`);
  }

  // ── Data migration: rename legacy 'REVIEWING' stage → 'REVISION' ────────────
  // Safe to run on every startup — becomes a no-op once all rows are updated.
  await tryExec(`
    UPDATE memos
    SET    stage      = 'REVISION',
           updated_at = datetime('now')
    WHERE  stage = 'REVIEWING';
  `);

  // ── Schema migration: new user_settings columns ────────────────────────────
  await tryExec(`ALTER TABLE user_settings ADD COLUMN revision_mode TEXT NOT NULL DEFAULT 'fixed';`);
  await tryExec(`ALTER TABLE user_settings ADD COLUMN revision_reps INTEGER NOT NULL DEFAULT 30;`);
  await tryExec(`ALTER TABLE user_settings ADD COLUMN session_reps  INTEGER NOT NULL DEFAULT 5;`);
}

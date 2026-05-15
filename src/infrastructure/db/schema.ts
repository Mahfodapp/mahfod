import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const memos = sqliteTable('memos', {
  id: text('id').primaryKey(),
  user_id: text('user_id'),
  title: text('title').notNull(),
  text: text('text').notNull().default(''),
  label: text('label').notNull().default(''),
  tags: text('tags').notNull().default('[]'),
  related_memo_id: text('related_memo_id'),
  audio_url: text('audio_url'),
  image_url: text('image_url'),
  stage: text('stage').default('LEARNING'),
  review_count: integer('review_count').default(0),
  repetition_count: integer('repetition_count').default(0),
  ease_factor: text('ease_factor'),       // SM-2: stored as text (JSON number) for compatibility
  interval_days: integer('interval_days').default(1), // SM-2: current interval
  next_review_at: text('next_review_at'),
  last_reviewed_at: text('last_reviewed_at'),
  is_favorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  is_poem: integer('is_poem', { mode: 'boolean' }).notNull().default(false),
  font_size: integer('font_size'),
  font_family: text('font_family'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  synced_at: text('synced_at'),
  deleted: integer('deleted', { mode: 'boolean' }).default(false),
  deleted_at: text('deleted_at'),
  version: integer('version').notNull().default(1),
  device_id: text('device_id'),
  last_modified_by: text('last_modified_by'),
});

export const noter_books = sqliteTable('noter_books', {
  id: text('id').primaryKey(),
  user_id: text('user_id'),
  title: text('title').notNull(),
  author: text('author').default(''),
  subject: text('subject').default(''),
  type: text('type').notNull().default('book'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  synced_at: text('synced_at'),
  deleted: integer('deleted', { mode: 'boolean' }).default(false),
  deleted_at: text('deleted_at'),
  version: integer('version').notNull().default(1),
  device_id: text('device_id'),
  last_modified_by: text('last_modified_by'),
});

export const noter_chapters = sqliteTable('noter_chapters', {
  id: text('id').primaryKey(),
  book_id: text('book_id').notNull(),
  title: text('title').notNull(),
  order_index: integer('order_index').notNull().default(0),
  version: integer('version').notNull().default(1),
  device_id: text('device_id'),
  last_modified_by: text('last_modified_by'),
  deleted_at: text('deleted_at'),
});

export const noter_notes = sqliteTable('noter_notes', {
  id: text('id').primaryKey(),
  book_id: text('book_id').notNull(),
  chapter_id: text('chapter_id'),
  user_id: text('user_id'),
  text: text('text').notNull(),
  note_type: text('note_type').notNull().default('فكرة'),
  page_ref: text('page_ref').default(''),
  order_index: integer('order_index').notNull().default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  synced_at: text('synced_at'),
  deleted: integer('deleted', { mode: 'boolean' }).default(false),
  deleted_at: text('deleted_at'),
  version: integer('version').notNull().default(1),
  device_id: text('device_id'),
  last_modified_by: text('last_modified_by'),
});

export const user_settings = sqliteTable('user_settings', {
  user_id: text('user_id').primaryKey(),
  language: text('language').notNull().default('ar'),
  initial_reps: integer('initial_reps').notNull().default(33),
  revision_mode: text('revision_mode').notNull().default('fixed'),  // 'fixed' | 'sm2'
  revision_reps: integer('revision_reps').notNull().default(30),    // fixed: sessions → MASTERED
  session_reps: integer('session_reps').notNull().default(5),       // reps per session
  review_days: integer('review_days').notNull().default(30),
  daily_review_count: integer('daily_review_count').notNull().default(5),
  reinforce_reps: integer('reinforce_reps').notNull().default(5),
  daily_notif_enabled: integer('daily_notif_enabled', { mode: 'boolean' }).notNull().default(false),
  daily_notif_time: text('daily_notif_time').notNull().default('07:00'),
  weekly_notif_enabled: integer('weekly_notif_enabled', { mode: 'boolean' }).notNull().default(false),
  weekly_notif_time: text('weekly_notif_time').notNull().default('20:00'),
  categories: text('categories').notNull().default('["متن","شعر","حديث","فقه","عقيدة"]'),
  vanish_mode: text('vanish_mode').notNull().default('none'),
  vanish_reps: integer('vanish_reps').notNull().default(3),
});

export const offlineQueue = sqliteTable('offline_queue', {
  id: text('id').primaryKey(),
  table_name: text('table_name').notNull(),
  record_id: text('record_id').notNull(),
  operation: text('operation').notNull(),
  payload: text('payload').notNull(),
  createdAt: text('created_at').notNull(),
  attempts: integer('attempts').default(0),
});

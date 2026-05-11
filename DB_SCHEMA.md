# Mahfod — Database Schema Reference (Schema Injection for AI)
# Always reference this before writing any DB queries or mutations.
# ORM: Drizzle ORM — client at src/infrastructure/db/client.ts
# Engine: expo-sqlite (local SQLite on device)

## Import pattern
```typescript
import { db } from 'src/infrastructure/db/client';
import { memos, noter_books, noter_chapters, noter_notes, user_settings, offlineQueue } from 'src/infrastructure/db/schema';
import { eq, and, lte, isNull, desc, asc } from 'drizzle-orm';
```

---

## Table: `memos`
```typescript
memos = {
  id:                 text   PRIMARY KEY          // nanoid()
  user_id:            text?                       // Supabase user UUID
  title:              text   NOT NULL             // memo title (Arabic)
  text:               text   NOT NULL DEFAULT ''  // body/content
  label:              text   NOT NULL DEFAULT ''  // category: متن|شعر|حديث|فقه|عقيدة|...
  tags:               text   NOT NULL DEFAULT '[]'// JSON array string → parse with JSON.parse()
  related_memo_id:    text?                       // FK → memos.id (optional link)
  audio_url:          text?                       // path to audio file
  image_url:          text?                       // path to image file
  stage:              text   DEFAULT 'LEARNING'   // 'LEARNING'|'REVISION'|'MASTERED'
  review_count:       int    DEFAULT 0            // total reviews done
  repetition_count:   int    DEFAULT 0            // daily rep count (LEARNING phase)
  next_review_at:     text?                       // ISO datetime for next scheduled review
  last_reviewed_at:   text?                       // ISO datetime of last review
  is_favorite:        bool   NOT NULL DEFAULT false
  is_poem:            bool   NOT NULL DEFAULT false // enables verse-mode display
  created_at:         text   NOT NULL             // ISO datetime
  updated_at:         text   NOT NULL             // ISO datetime
  synced_at:          text?                       // ISO datetime of last Supabase sync
  deleted:            bool   DEFAULT false        // SOFT DELETE — never hard delete
  deleted_at:         text?                       // ISO datetime of deletion
  version:            int    NOT NULL DEFAULT 1   // increment on every update
  device_id:          text?                       // originating device
  last_modified_by:   text?                       // user_id of last modifier
}
```

### Common queries
```typescript
// Get all active memos
const allMemos = await db.select().from(memos).where(eq(memos.deleted, false));

// Get memos due for review today
const dueToday = await db.select().from(memos).where(
  and(eq(memos.deleted, false), lte(memos.next_review_at, new Date().toISOString()))
);

// Get by stage
const learning = await db.select().from(memos)
  .where(and(eq(memos.deleted, false), eq(memos.stage, 'LEARNING')));

// Insert new memo
await db.insert(memos).values({
  id: nanoid(),
  title: 'عنوان المذكرة',
  text: 'نص المذكرة',
  label: 'متن',
  tags: JSON.stringify([]),
  stage: 'LEARNING',
  review_count: 0,
  repetition_count: 0,
  is_favorite: false,
  is_poem: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: 1,
});

// Soft delete
await db.update(memos)
  .set({ deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  .where(eq(memos.id, id));

// Update after review
await db.update(memos)
  .set({
    review_count: newState.reviewCount,
    next_review_at: newState.nextReviewAt,
    last_reviewed_at: newState.lastReviewedAt,
    stage: newState.stage,
    updated_at: new Date().toISOString(),
    version: memo.version + 1,
  })
  .where(eq(memos.id, memo.id));
```

---

## Table: `noter_books`
```typescript
noter_books = {
  id:          text  PRIMARY KEY   // nanoid()
  user_id:     text?
  title:       text  NOT NULL
  author:      text  DEFAULT ''
  subject:     text  DEFAULT ''
  type:        text  NOT NULL DEFAULT 'book'   // 'book' | 'article' | etc.
  created_at:  text  NOT NULL
  updated_at:  text  NOT NULL
  synced_at:   text?
  deleted:     bool  DEFAULT false
  deleted_at:  text?
  version:     int   NOT NULL DEFAULT 1
  device_id:   text?
  last_modified_by: text?
}
```

---

## Table: `noter_chapters`
```typescript
noter_chapters = {
  id:           text  PRIMARY KEY
  book_id:      text  NOT NULL    // FK → noter_books.id
  title:        text  NOT NULL
  order_index:  int   NOT NULL DEFAULT 0
  version:      int   NOT NULL DEFAULT 1
  device_id:    text?
  last_modified_by: text?
  deleted_at:   text?
}
```

---

## Table: `noter_notes`
```typescript
noter_notes = {
  id:          text  PRIMARY KEY
  book_id:     text  NOT NULL    // FK → noter_books.id
  chapter_id:  text?             // FK → noter_chapters.id
  user_id:     text?
  text:        text  NOT NULL
  note_type:   text  NOT NULL DEFAULT 'فكرة'  // فكرة|قلت|تلخيص|أبيات|تعقيب
  page_ref:    text  DEFAULT ''
  order_index: int   NOT NULL DEFAULT 0
  created_at:  text  NOT NULL
  updated_at:  text  NOT NULL
  synced_at:   text?
  deleted:     bool  DEFAULT false
  deleted_at:  text?
  version:     int   NOT NULL DEFAULT 1
  device_id:   text?
  last_modified_by: text?
}
```

---

## Table: `user_settings`
```typescript
user_settings = {
  user_id:              text  PRIMARY KEY
  language:             text  NOT NULL DEFAULT 'ar'
  initial_reps:         int   NOT NULL DEFAULT 33    // reps to graduate LEARNING→REVISION
  review_days:          int   NOT NULL DEFAULT 30    // days until REVISION→MASTERED
  daily_review_count:   int   NOT NULL DEFAULT 5     // memos per review session
  reinforce_reps:       int   NOT NULL DEFAULT 5
  daily_notif_enabled:  bool  NOT NULL DEFAULT false
  daily_notif_time:     text  NOT NULL DEFAULT '07:00'
  weekly_notif_enabled: bool  NOT NULL DEFAULT false
  weekly_notif_time:    text  NOT NULL DEFAULT '20:00'
  categories:           text  NOT NULL DEFAULT '["متن","شعر","حديث","فقه","عقيدة"]' // JSON
  vanish_mode:          text  NOT NULL DEFAULT 'none'
}
```

---

## Table: `offlineQueue`
```typescript
offlineQueue = {
  id:         text  PRIMARY KEY   // nanoid()
  table_name: text  NOT NULL      // 'memos' | 'noter_books' | etc.
  record_id:  text  NOT NULL      // ID of the record being synced
  operation:  text  NOT NULL      // 'INSERT' | 'UPDATE' | 'DELETE'
  payload:    text  NOT NULL      // JSON.stringify(record)
  createdAt:  text  NOT NULL      // ISO datetime
  attempts:   int   DEFAULT 0    // retry counter
}
```

### Enqueue a sync operation
```typescript
await db.insert(offlineQueue).values({
  id: nanoid(),
  table_name: 'memos',
  record_id: memo.id,
  operation: 'UPDATE',
  payload: JSON.stringify(memo),
  createdAt: new Date().toISOString(),
  attempts: 0,
});
```

---

## TypeScript Types (from src/types/index.ts)
```typescript
type MemoStage = 'LEARNING' | 'REVISION' | 'MASTERED';
type NoteType  = 'فكرة' | 'قلت' | 'تلخيص' | 'أبيات' | 'تعقيب';

interface Memo { id, title, text, label, tags[], stage, review_count,
                 repetition_count, next_review_at, last_reviewed_at,
                 is_favorite, is_poem, ... }
interface NoterBook    { id, title, author, subject, type, ... }
interface NoterChapter { id, book_id, title, order_index }
interface NoterNote    { id, book_id, chapter_id?, text, note_type, page_ref, order_index, ... }
interface UserSettings { user_id?, language, initial_reps, review_days,
                         daily_review_count, reinforce_reps, categories[], ... }
```

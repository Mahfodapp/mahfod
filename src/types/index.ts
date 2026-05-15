export type MemoStage = 'LEARNING' | 'REVISION' | 'MASTERED';
export type NoteType = 'فكرة' | 'قلت' | 'تلخيص' | 'أبيات' | 'تعقيب';

export interface Memo {
  id: string;
  user_id?: string;
  title: string;
  text: string;
  label: string;
  tags: string[];
  related_memo_id?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  stage: MemoStage;
  review_count: number;
  repetition_count: number;
  ease_factor?: number | null;      // SM-2: persisted ease factor (default 2.5)
  interval_days?: number | null;    // SM-2: persisted interval in days (default 1)
  next_review_at?: string | null;
  last_reviewed_at?: string | null;
  is_favorite: boolean;
  is_poem: boolean;
  font_size?: number | null;
  font_family?: string | null;
  deleted?: boolean;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoterBook {
  id: string;
  user_id?: string;
  title: string;
  author: string;
  subject: string;
  type: string;
  created_at?: string;
}

export interface NoterChapter {
  id: string;
  book_id: string;
  title: string;
  order_index: number;
}

export interface NoterNote {
  id: string;
  book_id: string;
  chapter_id?: string | null;
  user_id?: string;
  text: string;
  note_type: NoteType;
  page_ref: string;
  order_index: number;
  created_at?: string;
}

/**
 * 'fixed' — user sets a solid revision_reps count; daily cadence; no rating needed.
 * 'sm2'   — full SM-2 algorithm; user rates each session (0-3); auto-schedules intervals.
 */
export type RevisionMode = 'fixed' | 'sm2';

/**
 * Vanish modes for memo sessions:
 * 'none'     — no vanishing
 * 'opacity'  — text/images fade out after vanish_reps repetitions
 * 'sudden'   — text/images disappear abruptly after vanish_reps repetitions
 * 'words'    — random words disappear after vanish_reps repetitions (text only, no images)
 */
export type VanishMode = 'none' | 'opacity' | 'sudden' | 'words';

export interface UserSettings {
  user_id?: string;
  language: string;
  // ── LEARNING stage ──────────────────────────────────────────────────────────
  initial_reps: number;         // reps to memorize before → REVISION
  // ── REVISION stage ──────────────────────────────────────────────────────────
  revision_mode: RevisionMode;  // which system drives REVISION
  revision_reps: number;        // [fixed mode] total sessions needed → MASTERED
  session_reps: number;         // [fixed mode] reps per session (كررت N/M)
  review_days: number;          // legacy alias kept for backward-compat
  daily_review_count: number;   // max memos per session
  // ── MASTERED (Mohkam) stage ─────────────────────────────────────────────────
  reinforce_reps: number;       // mohkam: reps before considered truly mastered
  // ── Notifications ───────────────────────────────────────────────────────────
  daily_notif_enabled: boolean;
  daily_notif_time: string;
  weekly_notif_enabled: boolean;
  weekly_notif_time: string;
  // ── Misc ────────────────────────────────────────────────────────────────────
  categories: string[];
  vanish_mode: VanishMode;    // which vanish mode is active
  vanish_reps: number;        // number of reps before vanishing triggers
}

export type MemoStage = 'LEARNING' | 'REVIEWING' | 'MASTERED';
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
  next_review_at?: string | null;
  last_reviewed_at?: string | null;
  is_favorite: boolean;
  is_poem: boolean;
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

export interface UserSettings {
  user_id?: string;
  language: string;
  initial_reps: number;
  review_days: number;
  daily_review_count: number;
  reinforce_reps: number;
  daily_notif_enabled: boolean;
  daily_notif_time: string;
  weekly_notif_enabled: boolean;
  weekly_notif_time: string;
  categories: string[];
  vanish_mode: string;
}

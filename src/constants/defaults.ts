export type VanishMode = 'none' | 'opacity' | 'words' | 'all';

export const DEFAULT_SETTINGS = {
  language: 'ar' as const,
  initialRepetitions: 10,
  reinforceRepetitions: 5,
  reviewRepetitions: 5,
  masteryThreshold: 30,
  vanishMode: 'opacity' as VanishMode,
  vanishAllAfter: 5,
  fontSizeScale: 1,
  notificationsEnabled: false,
  notificationHour: 8,
  notificationMinute: 0,
  weeklyTestHour: 9,
  weeklyTestMinute: 0,
  onboardingDone: false,
  aiAgent: 'fast' as const,
  aiDifficulty: 'medium' as const,
  aiSubject: '',
  aiQuestionsCount: 5,
};

export const STORAGE_KEYS = {
  MEMOS: 'mahfod_memos',
  SETTINGS: 'mahfod_settings',
  PROGRESS: 'mahfod_progress',
  BOOKS: 'mahfod_books',
  REPS: 'mahfod_reps',
  STREAK: 'mahfod_streak',
  MEMO_PREFS: 'mahfod_memo_prefs',
  QURAN_STATE: 'mahfod_quran_state',
  QURAN_SETTINGS: 'mahfod_quran_settings',
  SYNC_QUEUE: 'mahfod_sync_queue',
} as const;

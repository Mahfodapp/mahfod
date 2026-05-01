import { create } from 'zustand';
import { UserSettings } from '../types';
import * as settingsService from '../services/settings.service';

interface SettingsStore {
  settings: UserSettings;
  isLoaded: boolean;
  load: (userId: string) => Promise<void>;
  update: (data: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  language: 'ar',
  initial_reps: 33,
  review_days: 30,
  daily_review_count: 5,
  reinforce_reps: 5,
  daily_notif_enabled: false,
  daily_notif_time: '07:00',
  weekly_notif_enabled: false,
  weekly_notif_time: '20:00',
  categories: ['متن', 'شعر', 'حديث', 'فقه', 'عقيدة'],
  vanish_mode: 'none',
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  load: async (userId: string) => {
    try {
      const fetchedSettings = await settingsService.getSettings(userId);
      set({ settings: fetchedSettings, isLoaded: true });
    } catch (e) {
      console.error('Failed to load settings', e);
      set({ isLoaded: true });
    }
  },
  update: async (data: Partial<UserSettings>) => {
    try {
      const current = get().settings;
      if (!current.user_id) return;
      const updated = await settingsService.saveSettings(current.user_id, data);
      set({ settings: updated });
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },
}));

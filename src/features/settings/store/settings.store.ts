import { create } from 'zustand';
import { UserSettings } from '../../../types';
import { MMKV } from 'react-native-mmkv';
import * as settingsService from '../settings.service';

const storage = new MMKV();
const SETTINGS_KEY = 'mahfod_settings';

interface SettingsStore {
  settings: UserSettings;
  isLoaded: boolean;
  load: (userId?: string) => Promise<void>;
  update: (data: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  language: 'ar',
  initial_reps: 33,
  revision_mode: 'fixed',
  revision_reps: 30,
  session_reps: 5,
  review_days: 30,
  daily_review_count: 5,
  reinforce_reps: 5,
  daily_notif_enabled: false,
  daily_notif_time: '07:00',
  weekly_notif_enabled: false,
  weekly_notif_time: '20:00',
  categories: ['متن', 'شعر', 'حديث', 'فقه', 'عقيدة'],
  vanish_mode: 'none',
  vanish_reps: 3,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  load: async (userId?: string) => {
    try {
      // 1. Immediately hydrate from MMKV (fast, synchronous)
      const localData = storage.getString(SETTINGS_KEY);
      let loadedSettings: UserSettings = { ...defaultSettings };
      if (localData) {
        loadedSettings = { ...defaultSettings, ...JSON.parse(localData) };
      }
      set({ settings: loadedSettings, isLoaded: true });

      // 2. If authenticated, fetch from Supabase and merge
      if (userId) {
        const remoteSettings = await settingsService.getSettings(userId).catch(() => null);
        if (remoteSettings) {
          // Only apply remote values that are non-null/undefined.
          // This prevents a missing Supabase column from clobbering a good local value.
          const cleanRemote = Object.fromEntries(
            Object.entries(remoteSettings).filter(([, v]) => v !== null && v !== undefined)
          ) as Partial<UserSettings>;
          loadedSettings = { ...loadedSettings, ...cleanRemote, user_id: userId };
          storage.set(SETTINGS_KEY, JSON.stringify(loadedSettings));
          set({ settings: loadedSettings });
        } else {
          // Remote fetch failed but we have a userId — attach it to local settings
          // so update() can still sync when back online
          loadedSettings = { ...loadedSettings, user_id: userId };
          set({ settings: loadedSettings });
        }
      }
    } catch (e) {
      console.error('Failed to load settings', e);
      set({ isLoaded: true });
    }
  },
  update: async (data: Partial<UserSettings>) => {
    try {
      const current = get().settings;
      const updated = { ...current, ...data };
      
      storage.set(SETTINGS_KEY, JSON.stringify(updated));
      set({ settings: updated });
      
      if (updated.user_id) {
        settingsService.saveSettings(updated.user_id, updated).catch(e => console.log('Remote sync failed:', e));
      }
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },
}));

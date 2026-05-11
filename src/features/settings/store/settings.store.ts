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
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  load: async (userId?: string) => {
    try {
      const localData = storage.getString(SETTINGS_KEY);
      let loadedSettings = defaultSettings;
      if (localData) {
        loadedSettings = { ...defaultSettings, ...JSON.parse(localData) };
      }
      set({ settings: loadedSettings, isLoaded: true });
      
      if (userId) {
        const remoteSettings = await settingsService.getSettings(userId).catch(() => null);
        if (remoteSettings) {
          loadedSettings = { ...loadedSettings, ...remoteSettings };
          storage.set(SETTINGS_KEY, JSON.stringify(loadedSettings));
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

import { supabase } from '../lib/supabase';
import { UserSettings } from '../types';

const defaultSettings: Omit<UserSettings, 'user_id'> = {
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

export async function getSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    return { user_id: userId, ...defaultSettings };
  }

  return data as UserSettings;
}

export async function saveSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
  const { data: result, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) throw error;
  return result as UserSettings;
}

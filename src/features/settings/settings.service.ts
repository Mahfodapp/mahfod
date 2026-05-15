/**
 * settings.service.ts
 *
 * The Supabase `user_settings` table schema:
 *   user_id  uuid        PRIMARY KEY
 *   settings jsonb       DEFAULT '{}'    ← ALL settings live here
 *   updated_at timestamptz
 *
 * We never write individual columns — the whole UserSettings object (minus
 * user_id, which is the PK) is serialised into the jsonb `settings` field.
 */
import { supabase } from '../../lib/supabase';
import { UserSettings } from '../../types';

const defaultSettings: Omit<UserSettings, 'user_id'> = {
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

export async function getSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = row not found — that's fine, we'll use defaults
    throw error;
  }

  if (!data || !data.settings) {
    return { user_id: userId, ...defaultSettings };
  }

  // Merge remote jsonb onto defaults so any new field added in code always
  // has a sane value even when the remote row pre-dates the field.
  return {
    user_id: userId,
    ...defaultSettings,
    ...(data.settings as Partial<UserSettings>),
  };
}

export async function saveSettings(
  userId: string,
  data: Partial<UserSettings>,
): Promise<UserSettings> {
  // Strip user_id — it is the PK column, not part of the jsonb payload
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id: _uid, ...settingsPayload } = data as UserSettings & { user_id?: string };

  const { data: result, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      settings: settingsPayload,
      updated_at: new Date().toISOString(),
    })
    .select('settings')
    .single();

  if (error) throw error;

  return {
    user_id: userId,
    ...defaultSettings,
    ...((result?.settings ?? {}) as Partial<UserSettings>),
  };
}

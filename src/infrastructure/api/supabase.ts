/**
 * src/infrastructure/api/supabase.ts
 *
 * Re-exports the canonical Supabase client from @/lib/supabase.
 * Auth helpers and settings sync are kept here for infrastructure consumers.
 *
 * ⚠️  Do NOT create a second `createClient` call — all modules share one instance.
 */
export { supabase } from '../../lib/supabase';

// ── Auth types ───────────────────────────────────────────────────────────────

import { supabase } from '../../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

// ── Auth helpers ─────────────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string
): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user as AuthUser;
}

export async function signUp(
  email: string,
  password: string
): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user as AuthUser;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser();
  return (data.user as AuthUser) ?? null;
}

// ── User settings sync ───────────────────────────────────────────────────────

export interface UserSettings {
  language: string;
  initial_repetitions: number;
  reinforcement_reps: number;
  daily_review_reps: number;
  mastery_threshold: number;
  daily_review_enabled: boolean;
  daily_review_time: string;
  weekly_test_enabled: boolean;
  weekly_test_time: string;
  memo_categories: string[];
  reading_categories: string[];
}

export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserSettings | null;
}

export async function upsertUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: userId, ...settings, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

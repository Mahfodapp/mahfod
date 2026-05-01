/**
 * src/services/supabase.ts
 * Supabase client init + AsyncStorage session persistence + auth helpers.
 * All other services import `supabase` from here (not from lib/).
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Client ───────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://fqypyxissuzpaohauuqw.supabase.co';

const SUPABASE_ANON =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxeXB5eGlzc3V6cGFvaGF1dXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODIxNjcsImV4cCI6MjA4ODY1ODE2N30.KSztbK9jg54RU_6Y1IyWmYZFmX91SFiKc4PSgJFP0ec';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:           AsyncStorage,   // persist session across app restarts
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,         // not applicable in React Native
  },
});

// ── Auth types ───────────────────────────────────────────────────────────────

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

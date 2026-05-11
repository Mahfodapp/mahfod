/**
 * Supabase client — Single source of truth.
 *
 * All features MUST import `supabase` from this file (via @/lib/supabase).
 * The infrastructure/api/supabase.ts re-exports from here.
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://fqypyxissuzpaohauuqw.supabase.co';
const SUPABASE_ANON =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxeXB5eGlzc3V6cGFvaGF1dXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODIxNjcsImV4cCI6MjA4ODY1ODE2N30.KSztbK9jg54RU_6Y1IyWmYZFmX91SFiKc4PSgJFP0ec';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

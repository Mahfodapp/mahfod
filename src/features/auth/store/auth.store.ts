import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { User } from '@supabase/supabase-js';
// Cross-store access — not a hook, safe inside async actions
import { useSettingsStore } from '../../settings/store/settings.store';

interface AuthStore {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  setGuest: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isGuest: false,
  isLoading: true,
  
  signIn: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      throw error;
    }
    set({ user: data.user, isGuest: false, isLoading: false });
    // Load account settings immediately after sign-in
    useSettingsStore.getState().load(data.user?.id);
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) {
      set({ isLoading: false });
      throw error;
    }
    set({ user: data.user, isGuest: false, isLoading: false });
    // Initialize settings for the new account
    useSettingsStore.getState().load(data.user?.id);
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, isGuest: false, isLoading: false });
    // Reload settings without a userId — falls back to local/default
    useSettingsStore.getState().load(undefined);
  },

  setGuest: () => {
    set({ user: null, isGuest: true, isLoading: false });
    // Load local-only settings (no userId = no remote sync)
    useSettingsStore.getState().load(undefined);
  },

  initialize: async () => {
    set({ isLoading: true });
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session) {
      set({ user: session.user, isGuest: false, isLoading: false });
      // Restore account settings for the resumed session — this is the key fix
      // for settings being forgotten after app reopen
      useSettingsStore.getState().load(session.user.id);
    } else {
      set({ user: null, isLoading: false });
      // Still load local/default settings even without a session
      useSettingsStore.getState().load(undefined);
    }
  },
}));

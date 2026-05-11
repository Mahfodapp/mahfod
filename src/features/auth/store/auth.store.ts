import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { User } from '@supabase/supabase-js';

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
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, isGuest: false, isLoading: false });
  },

  setGuest: () => {
    set({ user: null, isGuest: true, isLoading: false });
  },

  initialize: async () => {
    set({ isLoading: true });
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session) {
      set({ user: session.user, isGuest: false, isLoading: false });
    } else {
      set({ user: null, isLoading: false });
    }
  },
}));

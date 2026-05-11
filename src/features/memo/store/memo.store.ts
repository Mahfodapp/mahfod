import { create } from 'zustand';
import { Memo } from '../../../types';
import * as memoService from '../services/memo.service';
import { useSettingsStore } from '../../settings/store/settings.store';

interface MemoStore {
  memos: Memo[];
  isLoading: boolean;
  fetchMemos: (filters?: { stage?: string; label?: string; search?: string }) => Promise<void>;
  addMemo: (data: Omit<Memo, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Memo>;
  updateMemo: (id: string, data: Partial<Memo>) => Promise<Memo>;
  deleteMemo: (id: string) => Promise<void>;
  recordRepetition: (id: string) => Promise<import('../../../types').Memo | null>;
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  memos: [],
  isLoading: false,

  fetchMemos: async (filters) => {
    set({ isLoading: true });
    try {
      const memos = await memoService.getMemos(filters);
      set({ memos, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch memos', e);
      set({ isLoading: false });
    }
  },

  addMemo: async (data) => {
    const newMemo = await memoService.addMemo(data);
    set((state) => ({ memos: [newMemo, ...state.memos] }));
    return newMemo;
  },

  updateMemo: async (id, data) => {
    const updatedMemo = await memoService.updateMemo(id, data);
    set((state) => ({
      memos: state.memos.map((m) => (m.id === id ? updatedMemo : m)),
    }));
    return updatedMemo;
  },

  deleteMemo: async (id) => {
    await memoService.deleteMemo(id);
    set((state) => ({
      memos: state.memos.filter((m) => m.id !== id),
    }));
  },

  recordRepetition: async (id) => {
    const memo = get().memos.find((m) => m.id === id);
    if (!memo) return null;
    
    const settings = useSettingsStore.getState().settings;
    const initialReps = settings.initial_reps || 33;
    
    const updatedMemo = await memoService.recordRepetition(id, memo.repetition_count, initialReps);
    set((state) => ({
      memos: state.memos.map((m) => (m.id === id ? updatedMemo : m)),
    }));
    return updatedMemo;
  },
}));

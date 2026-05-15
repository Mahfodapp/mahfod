import { create } from 'zustand';
import { Memo } from '../../../types';
import * as memoService from '../services/memo.service';
import { useSettingsStore } from '../../settings/store/settings.store';

const PAGE_SIZE = 20;

interface MemoStore {
  // ── Full list (used by SRS / home stats) ──────────────────────────────────
  memos: Memo[];
  isLoading: boolean;
  fetchMemos: (filters?: { stage?: string; label?: string; search?: string }) => Promise<void>;

  // ── Paginated library list ─────────────────────────────────────────────────
  pagedMemos: Memo[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  fetchMemosPage: (filters?: { stage?: string; label?: string; search?: string }) => Promise<void>;
  loadMore: (filters?: { stage?: string; label?: string; search?: string }) => Promise<void>;
  resetPaged: () => void;

  // ── Mutations ─────────────────────────────────────────────────────────────
  addMemo: (data: Omit<Memo, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Memo>;
  updateMemo: (id: string, data: Partial<Memo>) => Promise<Memo>;
  deleteMemo: (id: string) => Promise<void>;
  recordRepetition: (id: string) => Promise<import('../../../types').Memo | null>;
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  // ── Full list ─────────────────────────────────────────────────────────────
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

  // ── Paginated state ────────────────────────────────────────────────────────
  pagedMemos: [],
  totalCount: 0,
  currentPage: 0,
  hasMore: true,
  isLoadingMore: false,

  /**
   * Resets paged state and loads the first page.
   * Call this when the screen mounts or filters change.
   */
  fetchMemosPage: async (filters) => {
    set({ isLoading: true, pagedMemos: [], currentPage: 0, hasMore: true });
    try {
      const [page0, total] = await Promise.all([
        memoService.getMemosPage(0, filters, PAGE_SIZE),
        memoService.getMemosCount(filters),
      ]);
      set({
        pagedMemos: page0,
        totalCount: total,
        currentPage: 0,
        hasMore: page0.length === PAGE_SIZE && page0.length < total,
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to fetch memo page', e);
      set({ isLoading: false });
    }
  },

  /**
   * Appends the next page to pagedMemos.
   * Safe to call even if hasMore is false (no-op).
   */
  loadMore: async (filters) => {
    const { hasMore, isLoadingMore, currentPage } = get();
    if (!hasMore || isLoadingMore) return;

    const nextPage = currentPage + 1;
    set({ isLoadingMore: true });
    try {
      const items = await memoService.getMemosPage(nextPage, filters, PAGE_SIZE);
      set((state) => ({
        pagedMemos: [...state.pagedMemos, ...items],
        currentPage: nextPage,
        hasMore: items.length === PAGE_SIZE,
        isLoadingMore: false,
      }));
    } catch (e) {
      console.error('Failed to load more memos', e);
      set({ isLoadingMore: false });
    }
  },

  /** Hard reset (e.g. when leaving the library screen) */
  resetPaged: () => {
    set({ pagedMemos: [], currentPage: 0, hasMore: true, totalCount: 0 });
  },

  // ── Mutations ─────────────────────────────────────────────────────────────

  addMemo: async (data) => {
    const newMemo = await memoService.addMemo(data);
    set((state) => ({
      memos: [newMemo, ...state.memos],
      // Prepend to paged list too so the user sees it immediately
      pagedMemos: [newMemo, ...state.pagedMemos],
      totalCount: state.totalCount + 1,
    }));
    return newMemo;
  },

  updateMemo: async (id, data) => {
    const updatedMemo = await memoService.updateMemo(id, data);
    set((state) => ({
      memos: state.memos.map((m) => (m.id === id ? updatedMemo : m)),
      pagedMemos: state.pagedMemos.map((m) => (m.id === id ? updatedMemo : m)),
    }));
    return updatedMemo;
  },

  deleteMemo: async (id) => {
    await memoService.deleteMemo(id);
    set((state) => ({
      memos: state.memos.filter((m) => m.id !== id),
      pagedMemos: state.pagedMemos.filter((m) => m.id !== id),
      totalCount: Math.max(0, state.totalCount - 1),
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
      pagedMemos: state.pagedMemos.map((m) => (m.id === id ? updatedMemo : m)),
    }));
    return updatedMemo;
  },
}));

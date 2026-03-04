import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MemoLabel = 'متن' | 'شعر' | 'حديث' | 'فقه' | 'عقيدة' | 'أخرى';
export type MemoStage = 'LEARNING' | 'REVIEWING' | 'MASTERED';

export interface Memo {
    id: string;
    title: string;
    text: string;
    label: MemoLabel;
    createdAt: string;      // ISO date
    lastReviewedAt: string | null;
    reviewCount: number;    // Number of daily reviews completed (0–30)
    stage: MemoStage;
}

interface Settings {
    initialRepetitions: number;  // times to repeat during learning (default 10)
    reviewRepetitions: number;   // times to repeat during daily review (default 5)
    vanishMode: 'opacity' | 'blur' | 'words'; // how text fades
}

interface MemoStore {
    memos: Memo[];
    settings: Settings;
    hydrated: boolean;
    hydrate: () => Promise<void>;
    addMemo: (title: string, text: string, label: MemoLabel) => void;
    completeLearning: (id: string) => void;
    completeReview: (id: string) => void;
    deleteMemo: (id: string) => void;
    updateSettings: (s: Partial<Settings>) => void;
    getTodayReviewMemos: () => Memo[];
    getRandomTestMemos: () => Memo[];
}

const STORAGE_KEY = 'mahfod_memos';
const SETTINGS_KEY = 'mahfod_settings';

const defaultSettings: Settings = {
    initialRepetitions: 10,
    reviewRepetitions: 5,
    vanishMode: 'opacity',
};

function daysSince(dateStr: string): number {
    const created = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isToday(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

export const useMemoStore = create<MemoStore>((set, get) => ({
    memos: [],
    settings: defaultSettings,
    hydrated: false,

    hydrate: async () => {
        try {
            const [memosJson, settingsJson] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY),
                AsyncStorage.getItem(SETTINGS_KEY),
            ]);
            const memos = memosJson ? JSON.parse(memosJson) : [];
            const settings = settingsJson ? { ...defaultSettings, ...JSON.parse(settingsJson) } : defaultSettings;
            set({ memos, settings, hydrated: true });
        } catch {
            set({ hydrated: true });
        }
    },

    addMemo: (title, text, label) => {
        const memo: Memo = {
            id: Date.now().toString(),
            title,
            text,
            label,
            createdAt: new Date().toISOString(),
            lastReviewedAt: null,
            reviewCount: 0,
            stage: 'LEARNING',
        };
        const memos = [...get().memos, memo];
        set({ memos });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    },

    completeLearning: (id) => {
        const memos = get().memos.map(m =>
            m.id === id ? { ...m, stage: 'REVIEWING' as MemoStage, lastReviewedAt: new Date().toISOString() } : m
        );
        set({ memos });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    },

    completeReview: (id) => {
        const memos = get().memos.map(m => {
            if (m.id !== id) return m;
            const newCount = m.reviewCount + 1;
            const newStage: MemoStage = newCount >= 30 ? 'MASTERED' : 'REVIEWING';
            return { ...m, reviewCount: newCount, stage: newStage, lastReviewedAt: new Date().toISOString() };
        });
        set({ memos });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    },

    deleteMemo: (id) => {
        const memos = get().memos.filter(m => m.id !== id);
        set({ memos });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    },

    updateSettings: (s) => {
        const settings = { ...get().settings, ...s };
        set({ settings });
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    },

    getTodayReviewMemos: () => {
        return get().memos.filter(m =>
            m.stage === 'REVIEWING' && !isToday(m.lastReviewedAt)
        );
    },

    getRandomTestMemos: () => {
        return get().memos.filter(m => m.stage === 'MASTERED');
    },
}));

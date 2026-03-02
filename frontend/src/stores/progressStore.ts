import { create } from 'zustand';
import { progressApi } from '../api/progress';
import type { ProgressSummary, StreakData, HeatmapEntry, Badge } from '../api/progress';

interface ProgressState {
  summary: ProgressSummary | null;
  streak: StreakData | null;
  heatmap: HeatmapEntry[];
  badges: Badge[];
  isLoading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  fetchHeatmap: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  clearError: () => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  summary: null,
  streak: null,
  heatmap: [],
  badges: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [summary, streak, heatmap, badges] = await Promise.all([
        progressApi.getSummary(),
        progressApi.getStreak(),
        progressApi.getHeatmap(),
        progressApi.getBadges(),
      ]);
      set({ summary, streak, heatmap, badges });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load progress';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await progressApi.getSummary();
      set({ summary });
    } catch {
      // Non-critical individual fetch
    }
  },

  fetchStreak: async () => {
    try {
      const streak = await progressApi.getStreak();
      set({ streak });
    } catch {
      // Non-critical individual fetch
    }
  },

  fetchHeatmap: async () => {
    try {
      const heatmap = await progressApi.getHeatmap();
      set({ heatmap });
    } catch {
      // Non-critical individual fetch
    }
  },

  fetchBadges: async () => {
    try {
      const badges = await progressApi.getBadges();
      set({ badges });
    } catch {
      // Non-critical individual fetch
    }
  },

  clearError: () => set({ error: null }),
}));

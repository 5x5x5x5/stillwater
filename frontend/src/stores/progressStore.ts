import { create } from 'zustand';
import {
  getProgressSummary,
  getStreak,
  getHeatmap,
  getBadges,
  appendLog,
} from '../lib/storage';
import type { ProgressSummary, StreakData, HeatmapEntry, Badge, MeditationLog } from '../lib/storage';

export type { ProgressSummary, StreakData, HeatmapEntry, Badge };

interface ProgressState {
  summary: ProgressSummary | null;
  streak: StreakData | null;
  heatmap: HeatmapEntry[];
  badges: Badge[];
  isLoading: boolean;
  error: string | null;

  fetchAll: () => void;
  fetchSummary: () => void;
  fetchStreak: () => void;
  fetchHeatmap: () => void;
  fetchBadges: () => void;
  logMeditation: (entry: Omit<MeditationLog, 'id' | 'created_at'>) => void;
  clearError: () => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  summary: null,
  streak: null,
  heatmap: [],
  badges: [],
  isLoading: false,
  error: null,

  fetchAll: () => {
    set({
      summary: getProgressSummary(),
      streak: getStreak(),
      heatmap: getHeatmap(),
      badges: getBadges(),
    });
  },

  fetchSummary: () => set({ summary: getProgressSummary() }),
  fetchStreak: () => set({ streak: getStreak() }),
  fetchHeatmap: () => set({ heatmap: getHeatmap() }),
  fetchBadges: () => set({ badges: getBadges() }),

  logMeditation: (entry) => {
    appendLog(entry);
    // Refresh all derived state after logging.
    set({
      summary: getProgressSummary(),
      streak: getStreak(),
      heatmap: getHeatmap(),
      badges: getBadges(),
    });
  },

  clearError: () => set({ error: null }),
}));

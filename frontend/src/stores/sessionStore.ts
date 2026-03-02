import { create } from 'zustand';
import { sessionsApi } from '../api/sessions';
import type { Session, SessionFilters, Tag } from '../api/sessions';

interface SessionState {
  sessions: Session[];
  total: number;
  page: number;
  perPage: number;
  filters: SessionFilters;
  dailyPick: Session | null;
  selectedSession: Session | null;
  categories: string[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;

  fetchSessions: (filters?: SessionFilters) => Promise<void>;
  fetchDailyPick: () => Promise<void>;
  fetchSession: (id: number) => Promise<Session>;
  fetchCategories: () => Promise<void>;
  fetchTags: () => Promise<void>;
  setFilters: (filters: SessionFilters) => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  total: 0,
  page: 1,
  perPage: 20,
  filters: {},
  dailyPick: null,
  selectedSession: null,
  categories: [],
  tags: [],
  isLoading: false,
  error: null,

  fetchSessions: async (filters?: SessionFilters) => {
    const mergedFilters = { ...get().filters, ...filters };
    set({ isLoading: true, error: null, filters: mergedFilters });
    try {
      const response = await sessionsApi.getSessions({
        ...mergedFilters,
        page: mergedFilters.page ?? get().page,
        per_page: mergedFilters.per_page ?? get().perPage,
      });
      set({
        sessions: response.items,
        total: response.total,
        page: response.page,
        perPage: response.per_page,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sessions';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDailyPick: async () => {
    try {
      const dailyPick = await sessionsApi.getDailyPick();
      set({ dailyPick });
    } catch {
      // Daily pick failing should not block the app
    }
  },

  fetchSession: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const session = await sessionsApi.getSession(id);
      set({ selectedSession: session });
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session';
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await sessionsApi.getCategories();
      set({ categories });
    } catch {
      // Non-critical
    }
  },

  fetchTags: async () => {
    try {
      const tags = await sessionsApi.getTags();
      set({ tags });
    } catch {
      // Non-critical
    }
  },

  setFilters: (filters: SessionFilters) => {
    set({ filters: { ...get().filters, ...filters, page: 1 } });
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchSessions({ page });
  },

  clearError: () => set({ error: null }),
}));

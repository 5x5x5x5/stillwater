import { create } from 'zustand';
import sessionsData from '../data/sessions.json';

export interface Tag {
  id: number;
  name: string;
}

export interface Session {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  audio_url: string;
  image_url: string;
  duration_seconds: number;
  instructor: string | null;
  is_daily_pick: boolean;
  tags: string[];
}

export interface SessionFilters {
  category?: string;
  subcategory?: string;
  tag?: string;
  min_duration?: number;
  max_duration?: number;
  search?: string;
  page?: number;
  per_page?: number;
}

const ALL_SESSIONS: Session[] = sessionsData as Session[];

function applyFilters(sessions: Session[], filters: SessionFilters): Session[] {
  let result = sessions;

  if (filters.category) {
    result = result.filter((s) => s.category === filters.category);
  }
  if (filters.subcategory) {
    result = result.filter((s) => s.subcategory === filters.subcategory);
  }
  if (filters.tag) {
    result = result.filter((s) => s.tags.includes(filters.tag!));
  }
  if (filters.min_duration !== undefined) {
    result = result.filter((s) => s.duration_seconds >= filters.min_duration!);
  }
  if (filters.max_duration !== undefined) {
    result = result.filter((s) => s.duration_seconds <= filters.max_duration!);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.instructor ?? '').toLowerCase().includes(q),
    );
  }

  return result;
}

interface SessionState {
  sessions: Session[];
  total: number;
  page: number;
  perPage: number;
  filters: SessionFilters;
  dailyPick: Session | null;
  selectedSession: Session | null;
  categories: string[];
  tags: string[];
  isLoading: boolean;
  error: string | null;

  fetchSessions: (filters?: SessionFilters) => void;
  fetchDailyPick: () => void;
  fetchSession: (id: number) => Session | null;
  fetchCategories: () => void;
  fetchTags: () => void;
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

  fetchSessions: (filters?: SessionFilters) => {
    const mergedFilters = { ...get().filters, ...filters };
    set({ filters: mergedFilters });

    const page = mergedFilters.page ?? get().page;
    const perPage = mergedFilters.per_page ?? get().perPage;

    const filtered = applyFilters(ALL_SESSIONS, mergedFilters);
    const start = (page - 1) * perPage;
    const paged = filtered.slice(start, start + perPage);

    set({
      sessions: paged,
      total: filtered.length,
      page,
      perPage,
    });
  },

  fetchDailyPick: () => {
    const pick = ALL_SESSIONS.find((s) => s.is_daily_pick) ?? ALL_SESSIONS[0] ?? null;
    set({ dailyPick: pick });
  },

  fetchSession: (id: number) => {
    const session = ALL_SESSIONS.find((s) => s.id === id) ?? null;
    set({ selectedSession: session });
    return session;
  },

  fetchCategories: () => {
    const cats = Array.from(new Set(ALL_SESSIONS.map((s) => s.category)));
    set({ categories: cats });
  },

  fetchTags: () => {
    const tagSet = new Set<string>();
    for (const s of ALL_SESSIONS) {
      for (const t of s.tags) tagSet.add(t);
    }
    set({ tags: Array.from(tagSet).sort() });
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

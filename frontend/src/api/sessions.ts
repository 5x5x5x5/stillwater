import { api } from './client';

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
  instructor: string;
  is_daily_pick: boolean;
  tags: Tag[];
  created_at: string;
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

export interface SessionsResponse {
  items: Session[];
  total: number;
  page: number;
  per_page: number;
}

function buildQuery(filters: SessionFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.subcategory) params.set('subcategory', filters.subcategory);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.min_duration !== undefined)
    params.set('min_duration', String(filters.min_duration));
  if (filters.max_duration !== undefined)
    params.set('max_duration', String(filters.max_duration));
  if (filters.search) params.set('search', filters.search);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.per_page !== undefined)
    params.set('per_page', String(filters.per_page));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const sessionsApi = {
  getSessions: (filters: SessionFilters = {}) =>
    api.get<SessionsResponse>(`/api/sessions${buildQuery(filters)}`),

  getDailyPick: () => api.get<Session>('/api/sessions/daily'),

  getSession: (id: number) => api.get<Session>(`/api/sessions/${id}`),

  getCategories: () => api.get<string[]>('/api/sessions/categories'),

  getTags: () => api.get<Tag[]>('/api/sessions/tags'),
};

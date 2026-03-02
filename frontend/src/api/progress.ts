import { api } from './client';

export interface LogMeditationPayload {
  session_id?: number;
  duration_seconds: number;
  completed: boolean;
  session_type: string;
}

export interface ProgressLog {
  id: number;
  session_id?: number;
  duration_seconds: number;
  completed: boolean;
  session_type: string;
  created_at: string;
}

export interface ProgressSummary {
  total_sessions: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  badges_earned: number;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_meditation_date: string | null;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  earned: boolean;
}

export const progressApi = {
  logMeditation: (payload: LogMeditationPayload) =>
    api.post<ProgressLog>('/api/progress/log', payload),

  getSummary: () => api.get<ProgressSummary>('/api/progress/summary'),

  getStreak: () => api.get<StreakData>('/api/progress/streak'),

  getHeatmap: () => api.get<HeatmapEntry[]>('/api/progress/heatmap'),

  getBadges: () => api.get<Badge[]>('/api/progress/badges'),
};

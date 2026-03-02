import { api } from './client';

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface UserPreferences {
  id: number;
  preferred_duration: number;
  theme: string;
  bell_sound: string;
  ambient_default: string;
}

export interface UpdatePreferencesPayload {
  preferred_duration?: number;
  theme?: string;
  bell_sound?: string;
  ambient_default?: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<User>('/api/auth/register', payload),

  login: (payload: LoginPayload) =>
    api.post<AuthToken>('/api/auth/login', payload),

  getMe: () => api.get<User>('/api/auth/me'),

  getPreferences: () => api.get<UserPreferences>('/api/auth/me/preferences'),

  updatePreferences: (payload: UpdatePreferencesPayload) =>
    api.put<UserPreferences>('/api/auth/me/preferences', payload),
};

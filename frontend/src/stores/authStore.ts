import { create } from 'zustand';
import { authApi } from '../api/auth';
import type { User, UserPreferences, UpdatePreferencesPayload } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  updatePreferences: (payload: UpdatePreferencesPayload) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  preferences: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { access_token } = await authApi.login({ email, password });
      localStorage.setItem('token', access_token);
      set({ token: access_token });
      await get().loadUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register({ email, password, display_name: displayName });
      await get().login(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, preferences: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isInitialized: true });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, token });
      await get().loadPreferences();
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  loadPreferences: async () => {
    try {
      const preferences = await authApi.getPreferences();
      set({ preferences });
    } catch {
      // Preferences failing should not block the app
    }
  },

  updatePreferences: async (payload) => {
    try {
      const preferences = await authApi.updatePreferences(payload);
      set({ preferences });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update preferences';
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

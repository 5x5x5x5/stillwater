import { create } from 'zustand';
import { getDisplayName, saveDisplayName, getPreferences, savePreferences } from '../lib/storage';
import type { Preferences } from '../lib/storage';

interface AuthState {
  displayName: string | null;
  preferences: Preferences;
  isInitialized: boolean;

  setDisplayName: (name: string) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  displayName: null,
  preferences: getPreferences(),
  isInitialized: false,

  initialize: () => {
    set({
      displayName: getDisplayName(),
      preferences: getPreferences(),
      isInitialized: true,
    });
  },

  setDisplayName: (name: string) => {
    saveDisplayName(name);
    set({ displayName: name });
  },

  updatePreferences: (prefs: Partial<Preferences>) => {
    const updated = savePreferences(prefs);
    set({ preferences: updated });
  },
}));

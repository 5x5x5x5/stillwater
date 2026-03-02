import { create } from 'zustand';
import type { Session } from '../api/sessions';

export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  url: string;
}

interface PlayerState {
  currentSession: Session | null;
  isPlaying: boolean;
  progress: number; // 0-1
  duration: number; // seconds
  elapsed: number; // seconds
  volume: number; // 0-1
  ambientSounds: Record<string, number>; // soundId -> volume 0-1
  bellInterval: number; // 0 = off, or seconds
  isExpanded: boolean;

  play: (session?: Session) => void;
  pause: () => void;
  toggle: () => void;
  seek: (progress: number) => void;
  setVolume: (volume: number) => void;
  setAmbient: (soundId: string, volume: number) => void;
  toggleAmbient: (soundId: string) => void;
  setBell: (interval: number) => void;
  expand: () => void;
  collapse: () => void;
  setProgress: (progress: number, elapsed: number) => void;
  setDuration: (duration: number) => void;
  stop: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSession: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  elapsed: 0,
  volume: 0.8,
  ambientSounds: {},
  bellInterval: 0,
  isExpanded: false,

  play: (session?: Session) => {
    if (session && session.id !== get().currentSession?.id) {
      set({ currentSession: session, progress: 0, elapsed: 0, isPlaying: true });
    } else {
      set({ isPlaying: true });
    }
  },

  pause: () => set({ isPlaying: false }),

  toggle: () => {
    const { isPlaying, currentSession } = get();
    if (!currentSession) return;
    set({ isPlaying: !isPlaying });
  },

  seek: (progress: number) => {
    const { duration } = get();
    const clamped = Math.max(0, Math.min(1, progress));
    set({ progress: clamped, elapsed: clamped * duration });
  },

  setVolume: (volume: number) => {
    set({ volume: Math.max(0, Math.min(1, volume)) });
  },

  setAmbient: (soundId: string, volume: number) => {
    set((state) => ({
      ambientSounds: { ...state.ambientSounds, [soundId]: Math.max(0, Math.min(1, volume)) },
    }));
  },

  toggleAmbient: (soundId: string) => {
    const current = get().ambientSounds[soundId];
    if (current && current > 0) {
      set((state) => ({
        ambientSounds: { ...state.ambientSounds, [soundId]: 0 },
      }));
    } else {
      set((state) => ({
        ambientSounds: { ...state.ambientSounds, [soundId]: 0.5 },
      }));
    }
  },

  setBell: (interval: number) => set({ bellInterval: interval }),

  expand: () => set({ isExpanded: true }),

  collapse: () => set({ isExpanded: false }),

  setProgress: (progress: number, elapsed: number) => set({ progress, elapsed }),

  setDuration: (duration: number) => set({ duration }),

  stop: () =>
    set({
      isPlaying: false,
      progress: 0,
      elapsed: 0,
    }),
}));

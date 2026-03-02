/**
 * Unit tests for the simplified (no-backend) authStore.
 *
 * Run with: npx vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      displayName: null,
      preferences: { preferred_duration: 10, bell_sound: 'singing_bowl', ambient_default: 'none' },
      isInitialized: false,
    });
  });

  it('initializes with null displayName before initialize() is called', () => {
    expect(useAuthStore.getState().displayName).toBeNull();
    expect(useAuthStore.getState().isInitialized).toBe(false);
  });

  it('initialize() reads displayName from localStorage', () => {
    localStorage.setItem('sw_display_name', 'Alice');
    useAuthStore.getState().initialize();
    expect(useAuthStore.getState().displayName).toBe('Alice');
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('initialize() sets isInitialized even when localStorage is empty', () => {
    useAuthStore.getState().initialize();
    expect(useAuthStore.getState().displayName).toBeNull();
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('setDisplayName() persists to localStorage and updates state', () => {
    useAuthStore.getState().setDisplayName('Bob');
    expect(useAuthStore.getState().displayName).toBe('Bob');
    expect(localStorage.getItem('sw_display_name')).toBe('Bob');
  });

  it('updatePreferences() merges partial preferences', () => {
    useAuthStore.getState().updatePreferences({ bell_sound: 'chime' });
    const prefs = useAuthStore.getState().preferences;
    expect(prefs.bell_sound).toBe('chime');
    expect(prefs.preferred_duration).toBe(10); // unchanged default
  });
});

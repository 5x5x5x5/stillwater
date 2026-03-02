/**
 * Unit tests for authStore.
 *
 * Run with: npx vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';

// Mock the API module
vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

import { authApi } from '../api/auth';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  display_name: 'Test User',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
};

const mockPreferences = {
  id: 1,
  preferred_duration: 10,
  theme: 'dark',
  bell_sound: 'default',
  ambient_default: 'none',
};

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state between tests
    useAuthStore.setState({
      user: null,
      token: null,
      preferences: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
    localStorage.clear();
  });

  it('initializes with null user', () => {
    const { user, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
  });

  it('sets user and token on successful login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: 'test-token',
      token_type: 'bearer',
    });
    vi.mocked(authApi.getMe).mockResolvedValue(mockUser);
    vi.mocked(authApi.getPreferences).mockResolvedValue(mockPreferences);

    await useAuthStore.getState().login('test@example.com', 'password');

    const { user, token } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(token).toBe('test-token');
    expect(localStorage.getItem('token')).toBe('test-token');
  });

  it('clears user on logout', async () => {
    useAuthStore.setState({ user: mockUser, token: 'test-token' });
    localStorage.setItem('token', 'test-token');

    useAuthStore.getState().logout();

    const { user, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('sets error on failed login', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      useAuthStore.getState().login('bad@example.com', 'wrong')
    ).rejects.toThrow();

    const { error, user } = useAuthStore.getState();
    expect(error).toBeTruthy();
    expect(user).toBeNull();
  });

  it('clears error with clearError', async () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('loads user from token if localStorage has one', async () => {
    localStorage.setItem('token', 'existing-token');
    vi.mocked(authApi.getMe).mockResolvedValue(mockUser);
    vi.mocked(authApi.getPreferences).mockResolvedValue(mockPreferences);

    // Re-create store state as it would be on app start
    useAuthStore.setState({ token: 'existing-token', isInitialized: false });
    await useAuthStore.getState().loadUser();

    const { user, isInitialized } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(isInitialized).toBe(true);
  });
});

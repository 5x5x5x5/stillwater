/**
 * Unit tests for useBreathingEngine hook.
 *
 * Run with: npx vitest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreathingEngine } from '../hooks/useBreathingEngine';
import type { BreathingPattern } from '../data/breathingPatterns';

// Mock progressApi to avoid network calls
vi.mock('../api/progress', () => ({
  progressApi: {
    logMeditation: vi.fn().mockResolvedValue({}),
  },
}));

const boxPattern: BreathingPattern = {
  id: 'box',
  name: 'Box Breathing',
  description: 'Test pattern',
  phases: [
    { name: 'Inhale', duration: 4 },
    { name: 'Hold', duration: 4 },
    { name: 'Exhale', duration: 4 },
    { name: 'Hold', duration: 4 },
  ],
};

describe('useBreathingEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with inactive state', () => {
    const { result } = renderHook(() =>
      useBreathingEngine({ pattern: boxPattern, durationMinutes: 5 })
    );
    expect(result.current.isActive).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.cycleCount).toBe(0);
    expect(result.current.totalElapsed).toBe(0);
  });

  it('starts with correct initial phase', () => {
    const { result } = renderHook(() =>
      useBreathingEngine({ pattern: boxPattern, durationMinutes: 5 })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentPhase?.name).toBe('Inhale');
  });

  it('can be paused and resumed', () => {
    const { result } = renderHook(() =>
      useBreathingEngine({ pattern: boxPattern, durationMinutes: 5 })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.isPaused).toBe(true);
    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.resume();
    });

    expect(result.current.isPaused).toBe(false);
    expect(result.current.isActive).toBe(true);
  });

  it('can be stopped', () => {
    const { result } = renderHook(() =>
      useBreathingEngine({ pattern: boxPattern, durationMinutes: 5 })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isActive).toBe(false);
  });

  it('does not start without a pattern', () => {
    const { result } = renderHook(() =>
      useBreathingEngine({ pattern: null, durationMinutes: 5 })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(false);
  });
});

describe('useBreathingEngine - ProgressBar', () => {
  it('phaseProgress stays between 0 and 1', () => {
    const { result } = renderHook(() =>
      useBreathingEngine({ pattern: boxPattern, durationMinutes: 1 })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.phaseProgress).toBeGreaterThanOrEqual(0);
    expect(result.current.phaseProgress).toBeLessThanOrEqual(1);
  });
});

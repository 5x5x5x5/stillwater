import { useState, useEffect, useRef, useCallback } from 'react';
import type { BreathingPattern, BreathingPhase } from '../data/breathingPatterns';
import { appendLog } from '../lib/storage';

interface BreathingEngineState {
  currentPhaseIndex: number;
  currentPhase: BreathingPhase | null;
  phaseProgress: number; // 0-1
  cycleCount: number;
  totalElapsed: number; // seconds
  isActive: boolean;
  isPaused: boolean;
  isComplete: boolean;
}

interface UseBreathingEngineOptions {
  pattern: BreathingPattern | null;
  durationMinutes: number;
  onComplete?: () => void;
}

export function useBreathingEngine({
  pattern,
  durationMinutes,
  onComplete,
}: UseBreathingEngineOptions) {
  const [state, setState] = useState<BreathingEngineState>({
    currentPhaseIndex: 0,
    currentPhase: null,
    phaseProgress: 0,
    cycleCount: 0,
    totalElapsed: 0,
    isActive: false,
    isPaused: false,
    isComplete: false,
  });

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseOffsetRef = useRef<number>(0); // accumulated pause time in ms
  const pauseStartRef = useRef<number | null>(null);
  const totalDurationMs = durationMinutes * 60 * 1000;

  const getCycleDuration = useCallback(() => {
    if (!pattern) return 0;
    return pattern.phases.reduce((sum, p) => sum + p.duration, 0);
  }, [pattern]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setState((prev) => ({ ...prev, isActive: false, isPaused: false }));
  }, []);

  const pause = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pauseStartRef.current = performance.now();
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    if (pauseStartRef.current !== null) {
      pauseOffsetRef.current += performance.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const start = useCallback(() => {
    if (!pattern) return;
    startTimeRef.current = performance.now();
    pauseOffsetRef.current = 0;
    pauseStartRef.current = null;
    setState({
      currentPhaseIndex: 0,
      currentPhase: pattern.phases[0],
      phaseProgress: 0,
      cycleCount: 0,
      totalElapsed: 0,
      isActive: true,
      isPaused: false,
      isComplete: false,
    });
  }, [pattern]);

  useEffect(() => {
    if (!state.isActive || state.isPaused || !pattern) return;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - (startTimeRef.current ?? now) - pauseOffsetRef.current;
      const totalElapsed = elapsed / 1000;

      if (elapsed >= totalDurationMs) {
        // Session complete
        cancelAnimationFrame(rafRef.current!);
        rafRef.current = null;
        setState((prev) => ({
          ...prev,
          isActive: false,
          isComplete: true,
          totalElapsed: durationMinutes * 60,
          phaseProgress: 1,
        }));

        // Log the completed meditation
        appendLog({
          session_id: null,
          duration_seconds: durationMinutes * 60,
          completed: true,
          session_type: 'breathing',
        });

        onComplete?.();
        return;
      }

      const cycleDuration = getCycleDuration();
      if (cycleDuration === 0) return;

      const cycleElapsed = (elapsed / 1000) % cycleDuration;
      const cycleCount = Math.floor((elapsed / 1000) / cycleDuration);

      let acc = 0;
      let phaseIndex = 0;
      let phaseElapsed = 0;

      for (let i = 0; i < pattern.phases.length; i++) {
        const phaseDur = pattern.phases[i].duration;
        if (cycleElapsed < acc + phaseDur) {
          phaseIndex = i;
          phaseElapsed = cycleElapsed - acc;
          break;
        }
        acc += phaseDur;
      }

      const currentPhase = pattern.phases[phaseIndex];
      const phaseProgress = phaseElapsed / currentPhase.duration;

      setState((prev) => ({
        ...prev,
        currentPhaseIndex: phaseIndex,
        currentPhase,
        phaseProgress: Math.min(1, phaseProgress),
        cycleCount,
        totalElapsed,
      }));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [state.isActive, state.isPaused, pattern, totalDurationMs, durationMinutes, getCycleDuration, onComplete]);

  return {
    ...state,
    start,
    pause,
    resume,
    stop,
  };
}

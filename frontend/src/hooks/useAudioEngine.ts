import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../stores/playerStore';

interface UseAudioEngineOptions {
  onComplete?: () => void;
}

export function useAudioEngine({ onComplete }: UseAudioEngineOptions = {}) {
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const {
    currentSession,
    isPlaying,
    volume,
    setProgress,
    setDuration,
    stop,
  } = usePlayerStore();

  const seekTo = useCallback((progress: number) => {
    if (!howlRef.current) return;
    const duration = howlRef.current.duration();
    if (duration > 0) {
      howlRef.current.seek(progress * duration);
    }
  }, []);

  // RAF loop to update progress
  const startProgressLoop = useCallback(() => {
    const tick = () => {
      const howl = howlRef.current;
      if (!howl) return;

      const duration = howl.duration();
      const elapsed = howl.seek() as number;

      if (duration > 0 && typeof elapsed === 'number') {
        const progress = elapsed / duration;
        setProgress(progress, elapsed);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [setProgress]);

  const stopProgressLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Build a new Howl when session changes
  useEffect(() => {
    if (!currentSession) return;

    // Destroy previous
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    stopProgressLoop();
    completedRef.current = false;

    const howl = new Howl({
      src: [currentSession.audio_url],
      html5: true,
      volume,
      onload: () => {
        setDuration(howl.duration());
      },
      onplay: () => {
        startProgressLoop();
      },
      onpause: () => {
        stopProgressLoop();
      },
      onstop: () => {
        stopProgressLoop();
      },
      onend: () => {
        stopProgressLoop();
        setProgress(1, howl.duration());
        if (!completedRef.current) {
          completedRef.current = true;
          stop();
          onComplete?.();
        }
      },
      onloaderror: () => {
        // Gracefully handle load errors — don't crash
        console.warn('Audio failed to load:', currentSession.audio_url);
        setDuration(currentSession.duration_seconds);
      },
      onplayerror: () => {
        console.warn('Audio failed to play');
      },
    });

    howlRef.current = howl;
    setDuration(currentSession.duration_seconds);

    return () => {
      howl.stop();
      howl.unload();
      stopProgressLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.id]);

  // Sync play/pause state
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    if (isPlaying) {
      if (!howl.playing()) {
        howl.play();
      }
    } else {
      if (howl.playing()) {
        howl.pause();
      }
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressLoop();
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
      }
    };
  }, [stopProgressLoop]);

  return { seekTo };
}

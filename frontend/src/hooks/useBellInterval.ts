import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../stores/playerStore';

export function useBellInterval() {
  const { bellInterval, isPlaying } = usePlayerStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bellHowlRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (!bellHowlRef.current) {
      bellHowlRef.current = new Howl({
        src: ['/audio/bell.mp3'],
        volume: 0.6,
        onloaderror: () => {
          console.warn('Bell sound failed to load');
        },
      });
    }
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (bellInterval > 0 && isPlaying) {
      intervalRef.current = setInterval(() => {
        bellHowlRef.current?.play();
      }, bellInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [bellInterval, isPlaying]);

  useEffect(() => {
    return () => {
      bellHowlRef.current?.unload();
    };
  }, []);
}

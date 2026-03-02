import { useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';

export function useMediaSession() {
  const { currentSession, isPlaying, toggle, stop } = usePlayerStore();

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!currentSession) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSession.title,
      artist: currentSession.instructor || 'Stillpoint',
      album: currentSession.category,
      artwork: currentSession.image_url
        ? [{ src: currentSession.image_url, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      toggle();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      toggle();
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      stop();
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    };
  }, [currentSession, toggle, stop]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);
}

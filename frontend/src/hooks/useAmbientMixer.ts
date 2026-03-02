import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { AMBIENT_SOUNDS } from '../data/ambientSounds';
import { usePlayerStore } from '../stores/playerStore';

export function useAmbientMixer() {
  const howlsRef = useRef<Record<string, Howl>>({});
  const { ambientSounds } = usePlayerStore();

  // Initialize all ambient Howl instances once
  useEffect(() => {
    AMBIENT_SOUNDS.forEach((sound) => {
      if (!howlsRef.current[sound.id]) {
        howlsRef.current[sound.id] = new Howl({
          src: [sound.url],
          loop: true,
          volume: 0,
          html5: true,
          onloaderror: () => {
            console.warn(`Ambient sound failed to load: ${sound.name}`);
          },
        });
      }
    });

    return () => {
      Object.values(howlsRef.current).forEach((howl) => {
        howl.stop();
        howl.unload();
      });
      howlsRef.current = {};
    };
  }, []);

  // Sync volumes whenever ambientSounds map changes
  useEffect(() => {
    Object.entries(ambientSounds).forEach(([soundId, targetVolume]) => {
      const howl = howlsRef.current[soundId];
      if (!howl) return;

      if (targetVolume > 0) {
        if (!howl.playing()) {
          howl.volume(0);
          howl.play();
          howl.fade(0, targetVolume, 500);
        } else {
          howl.fade(howl.volume(), targetVolume, 300);
        }
      } else {
        if (howl.playing()) {
          howl.fade(howl.volume(), 0, 400);
          setTimeout(() => {
            if (howl.volume() === 0) howl.stop();
          }, 450);
        }
      }
    });
  }, [ambientSounds]);
}

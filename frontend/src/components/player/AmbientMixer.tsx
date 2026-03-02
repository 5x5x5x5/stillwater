import { AMBIENT_SOUNDS } from '../../data/ambientSounds';
import { usePlayerStore } from '../../stores/playerStore';

export function AmbientMixer() {
  const { ambientSounds, setAmbient, toggleAmbient } = usePlayerStore();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-offwhite/60 uppercase tracking-widest">
        Ambient Sounds
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {AMBIENT_SOUNDS.map((sound) => {
          const volume = ambientSounds[sound.id] ?? 0;
          const isActive = volume > 0;

          return (
            <div
              key={sound.id}
              className={`rounded-xl p-3 flex flex-col items-center gap-2 transition-all duration-200 border ${
                isActive
                  ? 'bg-lavender/15 border-lavender/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              <button
                onClick={() => toggleAmbient(sound.id)}
                className="text-2xl leading-none focus:outline-none"
                aria-pressed={isActive}
                aria-label={`${sound.name} ambient sound`}
              >
                {sound.icon}
              </button>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-lavender' : 'text-offwhite/50'
                }`}
              >
                {sound.name}
              </span>

              {isActive && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setAmbient(sound.id, parseFloat(e.target.value))}
                  className="w-full accent-lavender h-1"
                  aria-label={`${sound.name} volume`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

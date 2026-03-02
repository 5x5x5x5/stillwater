import { motion } from 'framer-motion';
import { usePlayerStore } from '../../stores/playerStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useAmbientMixer } from '../../hooks/useAmbientMixer';
import { useBellInterval } from '../../hooks/useBellInterval';
import { useMediaSession } from '../../hooks/useMediaSession';
import { ProgressBar } from './ProgressBar';
import { AmbientMixer } from './AmbientMixer';
import { progressApi } from '../../api/progress';

const BELL_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  );
}

export function PlayerFullScreen() {
  const {
    currentSession,
    isPlaying,
    progress,
    elapsed,
    duration,
    volume,
    bellInterval,
    toggle,
    collapse,
    setVolume,
    setBell,
  } = usePlayerStore();

  const handleComplete = async () => {
    if (!currentSession) return;
    try {
      await progressApi.logMeditation({
        session_id: currentSession.id,
        duration_seconds: currentSession.duration_seconds,
        completed: true,
        session_type: currentSession.category,
      });
    } catch {
      // Non-critical
    }
  };

  const { seekTo } = useAudioEngine({ onComplete: handleComplete });
  useAmbientMixer();
  useBellInterval();
  useMediaSession();

  if (!currentSession) return null;

  const categoryGradient =
    currentSession.category === 'guided'
      ? 'from-lavender-dark via-navy to-navy'
      : currentSession.category === 'sleep_story'
      ? 'from-navy-light via-navy-dark to-navy'
      : 'from-sage-dark via-navy to-navy';

  const accentColor =
    currentSession.category === 'guided'
      ? 'bg-lavender'
      : currentSession.category === 'sleep_story'
      ? 'bg-sand'
      : 'bg-sage';

  const total = duration || currentSession.duration_seconds;
  const remaining = total - elapsed;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-navy overflow-y-auto"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${categoryGradient} opacity-70 pointer-events-none`} />

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={collapse}
            className="text-offwhite/60 hover:text-offwhite transition-colors focus:outline-none"
            aria-label="Collapse player"
          >
            <CollapseIcon />
          </button>
          <span className="text-xs font-medium text-offwhite/40 uppercase tracking-widest">
            {currentSession.category.replace('_', ' ')}
          </span>
          <div className="w-5" />
        </div>

        {/* Artwork */}
        <div className="flex-shrink-0 mx-auto mb-8">
          <div
            className={`w-56 h-56 md:w-72 md:h-72 rounded-2xl bg-gradient-to-br ${
              currentSession.category === 'guided'
                ? 'from-lavender/40 to-lavender-dark/60'
                : currentSession.category === 'sleep_story'
                ? 'from-navy-light to-navy-dark'
                : 'from-sage/40 to-sage-dark/60'
            } shadow-2xl overflow-hidden`}
          >
            {currentSession.image_url ? (
              <img
                src={currentSession.image_url}
                alt={currentSession.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-40">
                {currentSession.category === 'guided' ? '🧘' : currentSession.category === 'sleep_story' ? '🌙' : '🌿'}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl text-offwhite mb-1">{currentSession.title}</h2>
          {currentSession.instructor && (
            <p className="text-sm text-offwhite/50">{currentSession.instructor}</p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6 space-y-2">
          <ProgressBar
            progress={progress}
            onSeek={(p) => seekTo(p)}
            className="h-1.5"
            trackClassName="bg-white/15"
            fillClassName={accentColor}
          />
          <div className="flex justify-between text-xs text-offwhite/50">
            <span>{formatTime(elapsed)}</span>
            <span>-{formatTime(remaining)}</span>
          </div>
        </div>

        {/* Play controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={toggle}
            className={`w-16 h-16 rounded-full ${accentColor} text-navy flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>

        {/* Volume */}
        <div className="mb-8 flex items-center gap-3">
          <span className="text-offwhite/40 text-sm">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-lavender h-1"
            aria-label="Volume"
          />
          <span className="text-offwhite/40 text-sm w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Bell interval */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-offwhite/60 uppercase tracking-widest mb-3">
            Mindfulness Bell
          </h3>
          <div className="flex gap-2 flex-wrap">
            {BELL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBell(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  bellInterval === opt.value
                    ? 'bg-lavender/20 text-lavender border border-lavender/30'
                    : 'bg-white/5 text-offwhite/50 border border-white/10 hover:bg-white/10 hover:text-offwhite'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ambient mixer */}
        <AmbientMixer />
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { usePlayerStore } from '../../stores/playerStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useAmbientMixer } from '../../hooks/useAmbientMixer';
import { useBellInterval } from '../../hooks/useBellInterval';
import { useMediaSession } from '../../hooks/useMediaSession';
import { ProgressBar } from './ProgressBar';
import { progressApi } from '../../api/progress';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

export function PlayerBar() {
  const {
    currentSession,
    isPlaying,
    progress,
    elapsed,
    duration,
    toggle,
    expand,
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

  const categoryColor =
    currentSession.category === 'guided'
      ? 'from-lavender-dark to-lavender/60'
      : currentSession.category === 'sleep_story'
      ? 'from-navy-light to-navy'
      : 'from-sage-dark to-sage/60';

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 md:ml-64"
    >
      {/* Progress bar at the very top of player bar */}
      <ProgressBar
        progress={progress}
        onSeek={(p) => seekTo(p)}
        className="h-1"
        trackClassName="bg-white/10"
        fillClassName="bg-lavender"
      />

      <div className="bg-navy-dark/90 backdrop-blur-md border-t border-white/5 px-4 py-3 flex items-center gap-4">
        {/* Session thumbnail */}
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColor} flex-shrink-0 overflow-hidden`}
        >
          {currentSession.image_url && (
            <img
              src={currentSession.image_url}
              alt={currentSession.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Session info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-offwhite truncate">{currentSession.title}</p>
          <p className="text-xs text-offwhite/50 truncate">
            {formatTime(elapsed)} / {formatTime(duration || currentSession.duration_seconds)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-lavender text-navy flex items-center justify-center hover:bg-lavender-light transition-colors focus:outline-none focus:ring-2 focus:ring-lavender/50"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            onClick={expand}
            className="text-offwhite/50 hover:text-offwhite transition-colors focus:outline-none"
            aria-label="Expand player"
          >
            <ExpandIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

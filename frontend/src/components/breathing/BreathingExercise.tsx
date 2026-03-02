import { motion, AnimatePresence } from 'framer-motion';
import type { BreathingPattern } from '../../data/breathingPatterns';
import { useBreathingEngine } from '../../hooks/useBreathingEngine';
import { BreathingCircle } from './BreathingCircle';

interface BreathingExerciseProps {
  pattern: BreathingPattern;
  durationMinutes: number;
  onDone: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function BreathingExercise({ pattern, durationMinutes, onDone }: BreathingExerciseProps) {
  const { currentPhase, phaseProgress, cycleCount, totalElapsed, isActive, isPaused, isComplete, start, pause, resume, stop } =
    useBreathingEngine({ pattern, durationMinutes });

  const totalSeconds = durationMinutes * 60;
  const timeRemaining = Math.max(0, totalSeconds - Math.floor(totalElapsed));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 bg-navy flex flex-col items-center justify-center px-6"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-navy to-navy-light opacity-60 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Pattern name */}
        <div className="text-center">
          <h2 className="font-serif text-2xl text-offwhite">{pattern.name}</h2>
          <p className="text-sm text-offwhite/40 mt-1">
            {durationMinutes} min session
          </p>
        </div>

        {/* Breathing circle */}
        <BreathingCircle
          currentPhase={isActive ? currentPhase : null}
          phaseProgress={phaseProgress}
          isActive={isActive}
        />

        {/* Timer */}
        <div className="text-center">
          <p className="font-serif text-3xl text-offwhite/70">
            {formatTime(timeRemaining)}
          </p>
          {cycleCount > 0 && (
            <p className="text-sm text-offwhite/30 mt-1">
              {cycleCount} cycle{cycleCount !== 1 ? 's' : ''} completed
            </p>
          )}
        </div>

        {/* Controls */}
        <AnimatePresence mode="wait">
          {!isActive && !isComplete && (
            <motion.button
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={start}
              className="px-8 py-3 rounded-full bg-lavender text-navy font-semibold text-sm hover:bg-lavender-light transition-colors focus:outline-none focus:ring-2 focus:ring-lavender/50"
            >
              Begin
            </motion.button>
          )}

          {isActive && (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-4"
            >
              <button
                onClick={isPaused ? resume : pause}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-offwhite text-sm hover:bg-white/15 transition-colors focus:outline-none"
              >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => {
                  stop();
                  onDone();
                }}
                className="px-5 py-2.5 rounded-full bg-white/5 text-offwhite/60 text-sm hover:bg-white/10 hover:text-offwhite transition-colors focus:outline-none"
              >
                End
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion summary */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full rounded-2xl bg-lavender/10 border border-lavender/20 p-6 text-center"
            >
              <p className="text-2xl mb-2">🌸</p>
              <h3 className="font-serif text-xl text-lavender mb-1">Session Complete</h3>
              <p className="text-sm text-offwhite/60 mb-4">
                {cycleCount} cycle{cycleCount !== 1 ? 's' : ''} &middot; {durationMinutes} minutes
              </p>
              <button
                onClick={onDone}
                className="px-6 py-2.5 rounded-full bg-lavender text-navy font-semibold text-sm hover:bg-lavender-light transition-colors focus:outline-none"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

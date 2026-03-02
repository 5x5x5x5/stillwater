import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BREATHING_PATTERNS } from '../data/breathingPatterns';
import type { BreathingPattern } from '../data/breathingPatterns';
import { PatternCard } from '../components/breathing/PatternCard';
import { BreathingExercise } from '../components/breathing/BreathingExercise';

const DURATION_OPTIONS = [1, 3, 5, 10] as const;
type DurationOption = typeof DURATION_OPTIONS[number];

export default function BreathingPage() {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(5);
  const [isExercising, setIsExercising] = useState(false);

  const handleStart = () => {
    setIsExercising(true);
  };

  const handleDone = () => {
    setIsExercising(false);
  };

  return (
    <>
      <div className="min-h-screen px-4 md:px-8 pt-8 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl text-offwhite">Breathe</h1>
          <p className="text-offwhite/50 text-sm mt-1">Breathing exercises for calm and focus</p>
        </motion.div>

        {/* Pattern selector */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
          aria-label="Breathing patterns"
        >
          <p className="text-xs font-semibold text-offwhite/40 uppercase tracking-widest mb-4">
            Choose a pattern
          </p>
          <div className="space-y-3">
            {BREATHING_PATTERNS.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                isSelected={selectedPattern.id === pattern.id}
                onSelect={() => setSelectedPattern(pattern)}
              />
            ))}
          </div>
        </motion.section>

        {/* Duration picker */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
          aria-label="Session duration"
        >
          <p className="text-xs font-semibold text-offwhite/40 uppercase tracking-widest mb-4">
            Duration
          </p>
          <div className="flex gap-3">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`flex-1 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lavender/30 ${
                  selectedDuration === d
                    ? 'bg-lavender/15 border-lavender/30 text-lavender'
                    : 'bg-navy-light border-white/8 text-offwhite/60 hover:border-white/15 hover:text-offwhite'
                }`}
                aria-pressed={selectedDuration === d}
              >
                <span className="block font-serif text-xl text-offwhite">{d}</span>
                <span className="text-xs">min</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Selected summary + start */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="bg-navy-light border border-white/8 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-offwhite">{selectedPattern.name}</p>
                <p className="text-xs text-offwhite/50 mt-0.5">
                  {selectedDuration} minute session
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-offwhite/40">
                  ~{Math.round((selectedDuration * 60) / selectedPattern.phases.reduce((s, p) => s + p.duration, 0))} cycles
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-lavender text-navy font-semibold text-sm hover:bg-lavender-light transition-colors focus:outline-none focus:ring-2 focus:ring-lavender/50 shadow-lg shadow-lavender/20"
          >
            Begin Breathing
          </button>
        </motion.div>
      </div>

      {/* Fullscreen exercise overlay */}
      <AnimatePresence>
        {isExercising && (
          <BreathingExercise
            pattern={selectedPattern}
            durationMinutes={selectedDuration}
            onDone={handleDone}
          />
        )}
      </AnimatePresence>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

const DURATION_OPTIONS = [5, 10, 15, 20] as const;
type Duration = typeof DURATION_OPTIONS[number];

const STEP_COUNT = 2;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updatePreferences, isLoading } = useAuthStore();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState<Duration>(10);

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    try {
      await updatePreferences({
        preferred_duration: selectedDuration,
        theme: 'dark',
      });
    } catch {
      // Non-critical — proceed anyway
    }
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-radial from-lavender/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-lavender' : i < step ? 'w-3 bg-lavender/50' : 'w-3 bg-white/15'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="text-center mb-8">
                <p className="text-5xl mb-4">🧘</p>
                <h2 className="font-serif text-3xl text-offwhite mb-3">
                  How long do you like to meditate?
                </h2>
                <p className="text-offwhite/50 text-sm">
                  We&apos;ll use this as your default session duration
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`py-6 rounded-2xl border text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lavender/50 ${
                      selectedDuration === d
                        ? 'bg-lavender/15 border-lavender/30 text-lavender shadow-lg shadow-lavender/5'
                        : 'bg-navy-light border-white/8 text-offwhite/60 hover:border-white/20 hover:text-offwhite'
                    }`}
                    aria-pressed={selectedDuration === d}
                  >
                    <p className="font-serif text-3xl text-offwhite">{d}</p>
                    <p className="text-sm mt-1">minutes</p>
                  </button>
                ))}
              </div>

              <button
                onClick={goNext}
                className="w-full bg-lavender text-navy font-semibold py-3 rounded-xl text-sm hover:bg-lavender-light transition-colors focus:outline-none focus:ring-2 focus:ring-lavender/50"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="text-center mb-8">
                <p className="text-5xl mb-4">🌿</p>
                <h2 className="font-serif text-3xl text-offwhite mb-3">
                  You&apos;re all set
                </h2>
                <p className="text-offwhite/50 text-sm leading-relaxed">
                  Your space for calm is ready. Take a breath and begin your practice whenever you feel ready.
                </p>
              </div>

              <div className="bg-navy-light/50 border border-white/8 rounded-2xl p-5 mb-8 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎯</span>
                  <p className="text-sm text-offwhite/70">Default session length: <strong className="text-lavender">{selectedDuration} minutes</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌙</span>
                  <p className="text-sm text-offwhite/70">Theme: <strong className="text-lavender">Dark (calming)</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📊</span>
                  <p className="text-sm text-offwhite/70">Your progress will be tracked automatically</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goPrev}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-offwhite/60 text-sm hover:bg-white/5 hover:text-offwhite transition-colors focus:outline-none"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="flex-[2] bg-lavender text-navy font-semibold py-3 rounded-xl text-sm hover:bg-lavender-light transition-colors focus:outline-none focus:ring-2 focus:ring-lavender/50 disabled:opacity-60"
                >
                  {isLoading ? 'Saving...' : 'Start meditating'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

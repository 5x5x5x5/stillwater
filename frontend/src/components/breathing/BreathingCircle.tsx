import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { BreathingPhase } from '../../data/breathingPatterns';

interface BreathingCircleProps {
  currentPhase: BreathingPhase | null;
  phaseProgress: number; // 0-1
  isActive: boolean;
}

function phaseScale(phaseName: string, progress: number): number {
  switch (phaseName) {
    case 'Inhale':
      return 1.0 + progress * 0.6; // 1.0 -> 1.6
    case 'Hold':
      return 1.6; // hold at 1.6
    case 'Exhale':
      return 1.6 - progress * 0.6; // 1.6 -> 1.0
    default:
      return 1.0;
  }
}

function phaseColors(phaseName: string): { outer: string; inner: string; text: string } {
  switch (phaseName) {
    case 'Inhale':
      return {
        outer: 'rgba(196, 181, 224, 0.25)',
        inner: 'rgba(196, 181, 224, 0.5)',
        text: '#C4B5E0',
      };
    case 'Hold':
      return {
        outer: 'rgba(168, 197, 160, 0.25)',
        inner: 'rgba(168, 197, 160, 0.5)',
        text: '#A8C5A0',
      };
    case 'Exhale':
      return {
        outer: 'rgba(245, 230, 204, 0.25)',
        inner: 'rgba(245, 230, 204, 0.5)',
        text: '#F5E6CC',
      };
    default:
      return {
        outer: 'rgba(255,255,255,0.1)',
        inner: 'rgba(255,255,255,0.2)',
        text: '#FAF9F6',
      };
  }
}

export function BreathingCircle({ currentPhase, phaseProgress, isActive }: BreathingCircleProps) {
  const springScale = useSpring(1, { stiffness: 60, damping: 20 });
  const prevPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentPhase || !isActive) {
      springScale.set(1);
      return;
    }

    const targetScale = phaseScale(currentPhase.name, phaseProgress);
    springScale.set(targetScale);
    prevPhaseRef.current = currentPhase.name;
  }, [currentPhase, phaseProgress, isActive, springScale]);

  const displayPhase = currentPhase?.name ?? 'Ready';
  const colors = phaseColors(currentPhase?.name ?? '');

  // Outer ring pulses gently
  const outerScale = useTransform(springScale, [1, 1.6], [1.15, 1.4]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Outer glow ring */}
      <motion.div
        style={{
          scale: outerScale,
          backgroundColor: colors.outer,
        }}
        className="absolute inset-0 rounded-full transition-colors duration-700"
      />

      {/* Main circle */}
      <motion.div
        style={{
          scale: springScale,
          backgroundColor: colors.inner,
          borderColor: colors.text + '40',
        }}
        className="absolute inset-0 rounded-full border-2 transition-colors duration-700"
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.p
          key={displayPhase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-serif text-2xl text-offwhite"
          style={{ color: colors.text }}
        >
          {displayPhase}
        </motion.p>

        {currentPhase && isActive && (
          <p className="text-sm text-offwhite/40 mt-1">
            {currentPhase.duration}s
          </p>
        )}
      </div>
    </div>
  );
}

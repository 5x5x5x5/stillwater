import { motion } from 'framer-motion';
import type { BreathingPattern } from '../../data/breathingPatterns';

interface PatternCardProps {
  pattern: BreathingPattern;
  isSelected: boolean;
  onSelect: () => void;
}

function phaseColor(phaseName: string): string {
  switch (phaseName) {
    case 'Inhale':
      return 'bg-lavender';
    case 'Hold':
      return 'bg-sage';
    case 'Exhale':
      return 'bg-sand';
    default:
      return 'bg-white/20';
  }
}

export function PatternCard({ pattern, isSelected, onSelect }: PatternCardProps) {
  const totalDuration = pattern.phases.reduce((s, p) => s + p.duration, 0);

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`w-full text-left rounded-2xl p-5 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lavender/50 ${
        isSelected
          ? 'bg-lavender/10 border-lavender/30 shadow-lg shadow-lavender/5'
          : 'bg-navy-light border-white/8 hover:border-white/15'
      }`}
      aria-pressed={isSelected}
      aria-label={`${pattern.name} breathing pattern`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3
          className={`font-serif text-lg ${isSelected ? 'text-lavender' : 'text-offwhite'}`}
        >
          {pattern.name}
        </h3>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-lavender flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Phase visualization */}
      <div className="flex gap-1 mb-3 h-2 rounded-full overflow-hidden">
        {pattern.phases.map((phase, i) => (
          <div
            key={i}
            className={`${phaseColor(phase.name)} rounded-full transition-all`}
            style={{ flex: phase.duration / totalDuration }}
            title={`${phase.name}: ${phase.duration}s`}
          />
        ))}
      </div>

      {/* Phase labels */}
      <div className="flex flex-wrap gap-2 mb-3">
        {pattern.phases.map((phase, i) => (
          <span key={i} className="text-xs text-offwhite/50">
            {phase.name} {phase.duration}s
          </span>
        ))}
      </div>

      <p className="text-xs text-offwhite/40 leading-relaxed line-clamp-2">
        {pattern.description}
      </p>
    </motion.button>
  );
}

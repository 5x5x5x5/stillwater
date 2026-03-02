import { motion } from 'framer-motion';
import type { Badge } from '../../api/progress';

interface BadgeCardProps {
  badge: Badge;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: badge.earned ? 1.05 : 1.02, y: badge.earned ? -2 : 0 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl p-4 border flex flex-col items-center text-center gap-2 transition-all duration-200 ${
        badge.earned
          ? 'bg-lavender/10 border-lavender/25 shadow-lg shadow-lavender/5'
          : 'bg-white/3 border-white/8 opacity-50'
      }`}
      role="article"
      aria-label={`${badge.name} badge${badge.earned ? ' - earned' : ' - not yet earned'}`}
    >
      {badge.earned && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-sage flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      <span
        className={`text-3xl leading-none ${badge.earned ? '' : 'grayscale'}`}
        role="img"
        aria-label={badge.name}
      >
        {badge.icon}
      </span>

      <div>
        <h4 className={`text-sm font-semibold ${badge.earned ? 'text-lavender' : 'text-offwhite/60'}`}>
          {badge.name}
        </h4>
        <p className="text-xs text-offwhite/40 mt-0.5 leading-snug">{badge.description}</p>
      </div>
    </motion.div>
  );
}

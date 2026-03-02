import { motion } from 'framer-motion';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <div className="flex gap-6 items-start">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex items-end gap-2 justify-center"
        >
          <span className="font-serif text-5xl text-offwhite leading-none">{currentStreak}</span>
          <span className="text-2xl mb-1">🔥</span>
        </motion.div>
        <p className="text-sm text-offwhite/50 mt-1">day streak</p>
      </div>

      <div className="w-px h-14 bg-white/10 self-center" />

      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <span className="font-serif text-5xl text-offwhite/60 leading-none">{longestStreak}</span>
        </motion.div>
        <p className="text-sm text-offwhite/40 mt-1">best streak</p>
      </div>
    </div>
  );
}

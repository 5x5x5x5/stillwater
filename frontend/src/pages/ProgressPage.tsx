import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProgressStore } from '../stores/progressStore';
import { Heatmap } from '../components/progress/Heatmap';
import { BadgeCard } from '../components/progress/BadgeCard';
import { StreakDisplay } from '../components/progress/StreakDisplay';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  delay?: number;
}

function StatCard({ label, value, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-navy-light border border-white/8 rounded-2xl p-5 flex-1 min-w-0"
    >
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="font-serif text-3xl text-offwhite leading-none">{value}</p>
      <p className="text-xs text-offwhite/50 mt-1">{label}</p>
    </motion.div>
  );
}

export default function ProgressPage() {
  const { summary, streak, heatmap, badges, isLoading, fetchAll } = useProgressStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (isLoading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-lavender border-t-transparent animate-spin" />
      </div>
    );
  }

  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);

  return (
    <div className="min-h-screen px-4 md:px-8 pt-8 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="font-serif text-3xl text-offwhite">Progress</h1>
        <p className="text-offwhite/50 text-sm mt-1">Your meditation journey</p>
      </motion.div>

      {/* Streak display */}
      {streak && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
          aria-label="Streak"
        >
          <div className="bg-navy-light border border-white/8 rounded-2xl p-6">
            <StreakDisplay
              currentStreak={streak.current_streak}
              longestStreak={streak.longest_streak}
            />
          </div>
        </motion.section>
      )}

      {/* Stats row */}
      {summary && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex gap-3 mb-8 flex-wrap"
          aria-label="Statistics"
        >
          <StatCard
            label="Sessions"
            value={summary.total_sessions}
            icon="🧘"
            delay={0.2}
          />
          <StatCard
            label="Minutes"
            value={summary.total_minutes}
            icon="⏱️"
            delay={0.25}
          />
          <StatCard
            label="Badges"
            value={summary.badges_earned}
            icon="🏅"
            delay={0.3}
          />
        </motion.section>
      )}

      {/* Heatmap */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8"
        aria-label="Activity heatmap"
      >
        <h2 className="font-serif text-xl text-offwhite mb-4">Activity</h2>
        <div className="bg-navy-light border border-white/8 rounded-2xl p-5">
          <Heatmap data={heatmap} />
        </div>
      </motion.section>

      {/* Badges */}
      {badges.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          aria-label="Badges"
        >
          <h2 className="font-serif text-xl text-offwhite mb-4">Badges</h2>

          {earnedBadges.length > 0 && (
            <>
              <p className="text-xs font-semibold text-offwhite/40 uppercase tracking-widest mb-3">
                Earned
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {earnedBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </>
          )}

          {unearnedBadges.length > 0 && (
            <>
              <p className="text-xs font-semibold text-offwhite/40 uppercase tracking-widest mb-3">
                Locked
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {unearnedBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </>
          )}
        </motion.section>
      )}
    </div>
  );
}

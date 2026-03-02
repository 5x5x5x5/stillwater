import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { usePlayerStore } from '../stores/playerStore';
import { SessionCard } from '../components/sessions/SessionCard';

function formatDuration(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

const CATEGORY_CONFIG = [
  {
    id: 'guided',
    label: 'Guided',
    description: 'Instructor-led mindfulness',
    icon: '🧘',
    gradient: 'from-lavender-dark/70 to-lavender/30',
    border: 'border-lavender/20',
  },
  {
    id: 'sleep_story',
    label: 'Sleep Stories',
    description: 'Drift off peacefully',
    icon: '🌙',
    gradient: 'from-navy-light to-navy-dark',
    border: 'border-sand/15',
  },
  {
    id: 'soundscape',
    label: 'Soundscapes',
    description: 'Ambient nature sounds',
    icon: '🌿',
    gradient: 'from-sage-dark/70 to-sage/30',
    border: 'border-sage/20',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { displayName } = useAuthStore();
  const { dailyPick, sessions, isLoading, fetchDailyPick, fetchSessions } = useSessionStore();
  const { play } = usePlayerStore();

  useEffect(() => {
    fetchDailyPick();
    fetchSessions({ per_page: 6 });
  }, [fetchDailyPick, fetchSessions]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dailyGradient = dailyPick
    ? dailyPick.category === 'guided'
      ? 'from-lavender-dark via-navy to-navy'
      : dailyPick.category === 'sleep_story'
      ? 'from-navy-light via-navy-dark to-navy'
      : 'from-sage-dark via-navy to-navy'
    : 'from-lavender-dark/50 via-navy to-navy';

  return (
    <div className="min-h-screen px-4 md:px-8 pt-8 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="text-offwhite/50 text-sm">{greeting()},</p>
        <h1 className="font-serif text-3xl text-offwhite">
          {displayName ?? 'Friend'}
        </h1>
      </motion.div>

      {/* Daily pick hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
        aria-label="Daily pick"
      >
        <p className="text-xs font-semibold text-offwhite/40 uppercase tracking-widest mb-3">
          Today&apos;s Pick
        </p>

        {isLoading && !dailyPick ? (
          <div className="h-52 rounded-2xl bg-navy-light animate-pulse" />
        ) : dailyPick ? (
          <div
            className={`relative rounded-2xl overflow-hidden h-52 bg-gradient-to-br ${dailyGradient} cursor-pointer group`}
            onClick={() => navigate(`/sessions/${dailyPick.id}`)}
            role="button"
            aria-label={`Play ${dailyPick.title}`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/sessions/${dailyPick.id}`)}
          >
            {dailyPick.image_url && (
              <img
                src={dailyPick.image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 via-transparent to-transparent" />

            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-offwhite/50 mb-1">
                    {dailyPick.category.replace('_', ' ')} &middot; {formatDuration(dailyPick.duration_seconds)}
                  </p>
                  <h2 className="font-serif text-2xl text-offwhite leading-tight max-w-xs">
                    {dailyPick.title}
                  </h2>
                  {dailyPick.instructor && (
                    <p className="text-sm text-offwhite/60 mt-1">{dailyPick.instructor}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    play(dailyPick);
                  }}
                  className="w-12 h-12 rounded-full bg-offwhite text-navy flex items-center justify-center hover:bg-lavender transition-colors shadow-lg focus:outline-none"
                  aria-label={`Play ${dailyPick.title}`}
                >
                  <PlayIcon />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-52 rounded-2xl bg-navy-light border border-white/5 flex items-center justify-center">
            <p className="text-offwhite/30 text-sm">No daily pick available</p>
          </div>
        )}
      </motion.section>

      {/* Category quick links */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
        aria-label="Categories"
      >
        <p className="text-xs font-semibold text-offwhite/40 uppercase tracking-widest mb-3">
          Explore
        </p>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORY_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/library?category=${cat.id}`)}
              className={`rounded-xl bg-gradient-to-br ${cat.gradient} border ${cat.border} p-4 text-left transition-all duration-200 hover:opacity-90 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-lavender/30`}
              aria-label={`Browse ${cat.label}`}
            >
              <span className="text-2xl block mb-2">{cat.icon}</span>
              <p className="text-sm font-medium text-offwhite leading-snug">{cat.label}</p>
              <p className="text-xs text-offwhite/50 mt-0.5 hidden sm:block leading-snug">{cat.description}</p>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Recent sessions */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        aria-label="Recent sessions"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-offwhite/40 uppercase tracking-widest">
            Sessions
          </p>
          <button
            onClick={() => navigate('/library')}
            className="text-xs text-lavender/80 hover:text-lavender transition-colors"
          >
            View all
          </button>
        </div>

        {isLoading && sessions.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-navy-light animate-pulse" />
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sessions.slice(0, 6).map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-offwhite/30 text-sm">No sessions available</p>
          </div>
        )}
      </motion.section>
    </div>
  );
}

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useSessionStore } from '../stores/sessionStore';
import { usePlayerStore } from '../stores/playerStore';
import { SessionCard } from '../components/sessions/SessionCard';

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedSession, sessions, isLoading, fetchSession, fetchSessions } = useSessionStore();
  const { currentSession, isPlaying, play, pause } = usePlayerStore();

  const sessionId = id ? parseInt(id) : null;

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, fetchSession]);

  // Fetch related sessions once we know the category
  useEffect(() => {
    if (selectedSession) {
      fetchSessions({ category: selectedSession.category, per_page: 4 });
    }
  }, [selectedSession?.category, fetchSessions, selectedSession]);

  const isCurrentSession = currentSession?.id === selectedSession?.id;

  const handlePlayToggle = () => {
    if (!selectedSession) return;
    if (isCurrentSession && isPlaying) {
      pause();
    } else {
      play(selectedSession);
    }
  };

  if (isLoading && !selectedSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-lavender border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-offwhite/50">Session not found</p>
        <button onClick={() => navigate('/library')} className="text-lavender text-sm hover:text-lavender-light">
          Back to Library
        </button>
      </div>
    );
  }

  const categoryGradient =
    selectedSession.category === 'guided'
      ? 'from-lavender-dark/80 via-navy to-navy'
      : selectedSession.category === 'sleep_story'
      ? 'from-navy-light via-navy-dark to-navy'
      : 'from-sage-dark/80 via-navy to-navy';

  const relatedSessions = sessions
    .filter((s) => s.id !== selectedSession.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className={`relative h-72 md:h-80 bg-gradient-to-b ${categoryGradient}`}>
        {selectedSession.image_url && (
          <img
            src={selectedSession.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 md:left-8 z-10 flex items-center gap-2 text-offwhite/70 hover:text-offwhite transition-colors focus:outline-none"
          aria-label="Go back"
        >
          <ArrowLeftIcon />
        </button>

        {/* Play button centered in hero */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayToggle}
            className="w-16 h-16 rounded-full bg-offwhite/15 backdrop-blur-sm border border-white/20 text-offwhite flex items-center justify-center hover:bg-offwhite/25 transition-all focus:outline-none"
            aria-label={isCurrentSession && isPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentSession && isPlaying ? <PauseIcon /> : <PlayIcon />}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 md:px-8 pb-8 -mt-8 relative z-10"
      >
        {/* Meta */}
        <div className="flex items-center gap-2 mb-3 text-xs text-offwhite/50">
          <span className="capitalize">{selectedSession.category.replace('_', ' ')}</span>
          <span>·</span>
          <span>{formatDuration(selectedSession.duration_seconds)}</span>
          {selectedSession.instructor && (
            <>
              <span>·</span>
              <span>{selectedSession.instructor}</span>
            </>
          )}
        </div>

        <h1 className="font-serif text-3xl text-offwhite mb-4 leading-tight">
          {selectedSession.title}
        </h1>

        {/* Tags */}
        {selectedSession.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {selectedSession.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full bg-white/8 border border-white/10 text-offwhite/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {selectedSession.description && (
          <p className="text-offwhite/70 text-sm leading-relaxed mb-8">
            {selectedSession.description}
          </p>
        )}

        {/* Large play button */}
        <button
          onClick={handlePlayToggle}
          className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lavender/50 flex items-center justify-center gap-3 mb-8 ${
            isCurrentSession && isPlaying
              ? 'bg-offwhite/10 border border-white/15 text-offwhite hover:bg-offwhite/15'
              : 'bg-lavender text-navy hover:bg-lavender-light'
          }`}
        >
          {isCurrentSession && isPlaying ? (
            <>
              <PauseIcon />
              Pause
            </>
          ) : (
            <>
              <PlayIcon />
              {isCurrentSession ? 'Resume' : 'Play Session'}
            </>
          )}
        </button>

        {/* Related sessions */}
        {relatedSessions.length > 0 && (
          <section aria-label="Related sessions">
            <p className="text-xs font-semibold text-offwhite/40 uppercase tracking-widest mb-4">
              More like this
            </p>
            <div className="space-y-2">
              {relatedSessions.map((session) => (
                <SessionCard key={session.id} session={session} size="compact" />
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}

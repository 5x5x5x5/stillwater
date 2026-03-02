import { motion } from 'framer-motion';
import type { Session } from '../../stores/sessionStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useNavigate } from 'react-router';

interface SessionCardProps {
  session: Session;
  onClick?: () => void;
  size?: 'default' | 'compact';
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function categoryGradient(category: string): string {
  switch (category) {
    case 'guided':
      return 'from-lavender-dark/80 via-lavender/30 to-navy-light';
    case 'sleep_story':
      return 'from-navy-light via-navy to-navy-dark';
    case 'soundscape':
      return 'from-sage-dark/80 via-sage/30 to-navy-light';
    default:
      return 'from-navy-light to-navy-dark';
  }
}

function categoryAccent(category: string): string {
  switch (category) {
    case 'guided':
      return 'bg-lavender/20 text-lavender';
    case 'sleep_story':
      return 'bg-sand/20 text-sand';
    case 'soundscape':
      return 'bg-sage/20 text-sage';
    default:
      return 'bg-white/10 text-offwhite';
  }
}

function categoryLabel(category: string): string {
  switch (category) {
    case 'guided':
      return 'Guided';
    case 'sleep_story':
      return 'Sleep Story';
    case 'soundscape':
      return 'Soundscape';
    default:
      return category;
  }
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function SessionCard({ session, onClick, size = 'default' }: SessionCardProps) {
  const navigate = useNavigate();
  const { play } = usePlayerStore();

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/sessions/${session.id}`);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    play(session);
  };

  if (size === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
        className="flex items-center gap-3 p-3 rounded-xl bg-navy-light hover:bg-white/5 border border-white/5 cursor-pointer group transition-colors"
      >
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoryGradient(session.category)} flex-shrink-0 overflow-hidden`}
        >
          {session.image_url && (
            <img src={session.image_url} alt={session.title} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-offwhite truncate">{session.title}</p>
          <p className="text-xs text-offwhite/50">
            {formatDuration(session.duration_seconds)}
            {session.instructor ? ` · ${session.instructor}` : ''}
          </p>
        </div>
        <button
          onClick={handlePlay}
          className="w-8 h-8 rounded-full bg-lavender/10 text-lavender flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-lavender/20"
          aria-label={`Play ${session.title}`}
        >
          <PlayIcon />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer group bg-navy-light border border-white/5 shadow-lg"
      role="article"
      aria-label={`${session.title} - ${formatDuration(session.duration_seconds)}`}
    >
      {/* Background image or gradient */}
      <div className={`h-36 bg-gradient-to-br ${categoryGradient(session.category)} relative`}>
        {session.image_url && (
          <img
            src={session.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 to-transparent" />

        {/* Duration badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-navy-dark/70 backdrop-blur-sm text-offwhite/80 text-xs px-2 py-1 rounded-full">
            {formatDuration(session.duration_seconds)}
          </span>
        </div>

        {/* Play button - visible on hover */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            animate={{ scale: 1, opacity: 0 }}
            className="w-12 h-12 rounded-full bg-offwhite/20 backdrop-blur-sm text-offwhite flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity"
            onClick={handlePlay}
            aria-label={`Play ${session.title}`}
          >
            <PlayIcon />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryAccent(session.category)}`}>
            {categoryLabel(session.category)}
          </span>
        </div>
        <h3 className="text-sm font-medium text-offwhite leading-snug line-clamp-2">
          {session.title}
        </h3>
        {session.instructor && (
          <p className="text-xs text-offwhite/50 mt-1">{session.instructor}</p>
        )}
      </div>
    </motion.div>
  );
}

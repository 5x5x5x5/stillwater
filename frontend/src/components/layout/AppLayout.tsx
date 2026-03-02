import { Outlet, NavLink } from 'react-router';
import { PlayerBar } from '../player/PlayerBar';
import { PlayerFullScreen } from '../player/PlayerFullScreen';
import { usePlayerStore } from '../../stores/playerStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="18" rx="1" />
    </svg>
  );
}

function BreatheIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: 'Home', icon: <HomeIcon /> },
  { to: '/library', label: 'Library', icon: <LibraryIcon /> },
  { to: '/breathe', label: 'Breathe', icon: <BreatheIcon /> },
  { to: '/progress', label: 'Progress', icon: <ProgressIcon /> },
];

export function AppLayout() {
  const { currentSession, isExpanded } = usePlayerStore();
  const hasPlayer = currentSession !== null;

  return (
    <div className="flex min-h-screen bg-navy">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-navy-dark border-r border-white/5 py-8 px-4 fixed left-0 top-0 bottom-0">
        <div className="mb-10 px-2">
          <span className="font-serif text-2xl text-lavender tracking-wide">Stillpoint</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-lavender/15 text-lavender'
                    : 'text-offwhite/60 hover:text-offwhite hover:bg-white/5'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-2 text-xs text-offwhite/30">
          Version 1.0
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 md:ml-64 transition-all duration-200 ${
          hasPlayer ? 'pb-36 md:pb-24' : 'pb-20 md:pb-0'
        }`}
      >
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-navy-dark/90 backdrop-blur-md border-t border-white/5 ${
          hasPlayer ? 'bottom-16' : 'bottom-0'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 min-w-0 ${
                  isActive ? 'text-lavender' : 'text-offwhite/50 hover:text-offwhite'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Player bar */}
      {hasPlayer && !isExpanded && <PlayerBar />}

      {/* Player fullscreen */}
      {isExpanded && <PlayerFullScreen />}
    </div>
  );
}

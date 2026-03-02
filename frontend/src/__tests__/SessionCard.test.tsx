/**
 * Unit test structure for SessionCard component.
 *
 * Run with: npx vitest (after installing vitest + @testing-library/react)
 *
 * Required dev dependencies to install:
 *   npm install -D vitest @testing-library/react @testing-library/user-event jsdom @testing-library/jest-dom
 *
 * Add to vite.config.ts:
 *   test: { environment: 'jsdom', setupFiles: ['./src/__tests__/setup.ts'] }
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SessionCard } from '../components/sessions/SessionCard';
import type { Session } from '../api/sessions';

// Mock Zustand player store
vi.mock('../stores/playerStore', () => ({
  usePlayerStore: () => ({
    play: vi.fn(),
    currentSession: null,
    isPlaying: false,
  }),
}));

// Mock framer-motion to avoid animation side effects in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockSession: Session = {
  id: 1,
  title: 'Morning Calm',
  description: 'A peaceful morning meditation',
  category: 'guided',
  subcategory: 'morning',
  audio_url: '/audio/morning-calm.mp3',
  image_url: '',
  duration_seconds: 600,
  instructor: 'Jane Smith',
  is_daily_pick: false,
  tags: [{ id: 1, name: 'morning' }],
  created_at: '2025-01-01T00:00:00Z',
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('SessionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the session title', () => {
    renderWithRouter(<SessionCard session={mockSession} />);
    expect(screen.getByText('Morning Calm')).toBeInTheDocument();
  });

  it('renders the formatted duration', () => {
    renderWithRouter(<SessionCard session={mockSession} />);
    expect(screen.getByText('10 min')).toBeInTheDocument();
  });

  it('renders the instructor name', () => {
    renderWithRouter(<SessionCard session={mockSession} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders the category label', () => {
    renderWithRouter(<SessionCard session={mockSession} />);
    expect(screen.getByText('Guided')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    renderWithRouter(<SessionCard session={mockSession} onClick={onClick} />);
    fireEvent.click(screen.getByRole('article'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders compact variant without category label', () => {
    renderWithRouter(<SessionCard session={mockSession} size="compact" />);
    expect(screen.getByText('Morning Calm')).toBeInTheDocument();
    expect(screen.queryByText('Guided')).not.toBeInTheDocument();
  });

  it('renders correct category label for sleep_story', () => {
    const sleepSession = { ...mockSession, category: 'sleep_story' };
    renderWithRouter(<SessionCard session={sleepSession} />);
    expect(screen.getByText('Sleep Story')).toBeInTheDocument();
  });

  it('renders correct category label for soundscape', () => {
    const soundSession = { ...mockSession, category: 'soundscape' };
    renderWithRouter(<SessionCard session={soundSession} />);
    expect(screen.getByText('Soundscape')).toBeInTheDocument();
  });

  it('has accessible article role with aria-label', () => {
    renderWithRouter(<SessionCard session={mockSession} />);
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', 'Morning Calm - 10 min');
  });
});

describe('SessionCard - ProgressBar', () => {
  it('renders play button accessible label', () => {
    renderWithRouter(<SessionCard session={mockSession} />);
    const playButtons = screen.getAllByRole('button', { name: /play morning calm/i });
    expect(playButtons.length).toBeGreaterThan(0);
  });
});

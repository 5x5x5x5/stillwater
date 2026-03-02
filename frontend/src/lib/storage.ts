/**
 * localStorage adapter — replaces the entire backend API layer.
 * All progress data lives in the browser under the keys defined below.
 */

// ── Storage keys ────────────────────────────────────────────────────────────

const KEYS = {
  displayName: 'sw_display_name',
  preferences: 'sw_preferences',
  logs: 'sw_logs',
  streak: 'sw_streak',
  badges: 'sw_earned_badges',
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export interface Preferences {
  preferred_duration: number;
  bell_sound: string;
  ambient_default: string;
}

export interface MeditationLog {
  id: string;
  session_id: number | null;
  duration_seconds: number;
  completed: boolean;
  session_type: string; // category value
  created_at: string;   // ISO date string
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_meditation_date: string | null; // YYYY-MM-DD
}

export interface HeatmapEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'total_sessions' | 'streak' | 'categories';
  requirement_value: number;
}

export interface Badge extends BadgeDefinition {
  earned: boolean;
}

export interface ProgressSummary {
  total_sessions: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  badges_earned: number;
}

// ── Badge definitions (verbatim from seed.py) ────────────────────────────────

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your very first meditation session.',
    icon: '🌱',
    requirement_type: 'total_sessions',
    requirement_value: 1,
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Complete 50 meditation sessions.',
    icon: '🔥',
    requirement_type: 'total_sessions',
    requirement_value: 50,
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Complete 100 meditation sessions.',
    icon: '💯',
    requirement_type: 'total_sessions',
    requirement_value: 100,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day meditation streak.',
    icon: '⚡',
    requirement_type: 'streak',
    requirement_value: 7,
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Maintain a 30-day meditation streak.',
    icon: '🏅',
    requirement_type: 'streak',
    requirement_value: 30,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Meditate across 3 different session types.',
    icon: '🧭',
    requirement_type: 'categories',
    requirement_value: 3,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return toDateString(new Date());
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Display name ──────────────────────────────────────────────────────────────

export function getDisplayName(): string | null {
  return localStorage.getItem(KEYS.displayName);
}

export function saveDisplayName(name: string): void {
  localStorage.setItem(KEYS.displayName, name);
}

// ── Preferences ───────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: Preferences = {
  preferred_duration: 10,
  bell_sound: 'singing_bowl',
  ambient_default: 'none',
};

export function getPreferences(): Preferences {
  return read<Preferences>(KEYS.preferences, DEFAULT_PREFERENCES);
}

export function savePreferences(prefs: Partial<Preferences>): Preferences {
  const merged = { ...getPreferences(), ...prefs };
  write(KEYS.preferences, merged);
  return merged;
}

// ── Meditation logs ───────────────────────────────────────────────────────────

export function getMeditationLogs(): MeditationLog[] {
  return read<MeditationLog[]>(KEYS.logs, []);
}

export function appendLog(entry: Omit<MeditationLog, 'id' | 'created_at'>): MeditationLog {
  const log: MeditationLog = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const logs = getMeditationLogs();
  logs.push(log);
  write(KEYS.logs, logs);
  recalculateStreak();
  checkAndAwardBadges();
  return log;
}

// ── Streak ────────────────────────────────────────────────────────────────────

const DEFAULT_STREAK: StreakData = {
  current_streak: 0,
  longest_streak: 0,
  last_meditation_date: null,
};

export function getStreak(): StreakData {
  return read<StreakData>(KEYS.streak, DEFAULT_STREAK);
}

/**
 * Recalculate streak after a new log is appended.
 * Mirrors the state-machine logic in services/progress.py::update_streak().
 */
export function recalculateStreak(): StreakData {
  const streak = getStreak();
  const last = streak.last_meditation_date;
  const todayStr = today();
  const yesterdayStr = yesterday();

  let current = streak.current_streak;

  if (last === null) {
    current = 1;
  } else if (last === todayStr) {
    // Already logged today — do not double-count.
  } else if (last === yesterdayStr) {
    current += 1;
  } else {
    // Gap — reset.
    current = 1;
  }

  const longest = Math.max(streak.longest_streak, current);
  const updated: StreakData = {
    current_streak: current,
    longest_streak: longest,
    last_meditation_date: todayStr,
  };
  write(KEYS.streak, updated);
  return updated;
}

// ── Badges ────────────────────────────────────────────────────────────────────

export function getEarnedBadgeIds(): Set<string> {
  return new Set<string>(read<string[]>(KEYS.badges, []));
}

/**
 * Award any badges newly qualified for.
 * Mirrors services/progress.py::check_badges().
 */
export function checkAndAwardBadges(): void {
  const logs = getMeditationLogs();
  const streak = getStreak();
  const earnedIds = getEarnedBadgeIds();

  const totalSessions = logs.filter((l) => l.completed).length;
  const currentStreak = streak.current_streak;
  const distinctCategories = new Set(logs.filter((l) => l.completed).map((l) => l.session_type)).size;

  let changed = false;
  for (const badge of BADGE_DEFINITIONS) {
    if (earnedIds.has(badge.id)) continue;

    let qualified = false;
    if (badge.requirement_type === 'total_sessions') {
      qualified = totalSessions >= badge.requirement_value;
    } else if (badge.requirement_type === 'streak') {
      qualified = currentStreak >= badge.requirement_value;
    } else if (badge.requirement_type === 'categories') {
      qualified = distinctCategories >= badge.requirement_value;
    }

    if (qualified) {
      earnedIds.add(badge.id);
      changed = true;
    }
  }

  if (changed) {
    write(KEYS.badges, Array.from(earnedIds));
  }
}

export function getBadges(): Badge[] {
  const earnedIds = getEarnedBadgeIds();
  return BADGE_DEFINITIONS.map((b) => ({ ...b, earned: earnedIds.has(b.id) }));
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

/**
 * Return daily completed-session counts for the past 365 days.
 * Matches the shape returned by GET /api/progress/heatmap.
 */
export function getHeatmap(): HeatmapEntry[] {
  const logs = getMeditationLogs().filter((l) => l.completed);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 364);
  const cutoffStr = toDateString(cutoff);

  const counts = new Map<string, number>();
  for (const log of logs) {
    const d = log.created_at.slice(0, 10);
    if (d >= cutoffStr) {
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

// ── Progress summary ──────────────────────────────────────────────────────────

export function getProgressSummary(): ProgressSummary {
  const logs = getMeditationLogs().filter((l) => l.completed);
  const streak = getStreak();
  const earnedIds = getEarnedBadgeIds();

  const totalSessions = logs.length;
  const totalMinutes = Math.floor(logs.reduce((sum, l) => sum + l.duration_seconds, 0) / 60);

  return {
    total_sessions: totalSessions,
    total_minutes: totalMinutes,
    current_streak: streak.current_streak,
    longest_streak: streak.longest_streak,
    badges_earned: earnedIds.size,
  };
}

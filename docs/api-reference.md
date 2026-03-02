# Storage API Reference

All persistent data operations go through `frontend/src/lib/storage.ts`. This is the public API surface that replaces the HTTP API layer.

---

## Types

```ts
interface Preferences {
  preferred_duration: number;
  bell_sound: string;
  ambient_default: string;
}

interface MeditationLog {
  id: string;              // crypto.randomUUID()
  session_id: number | null;
  duration_seconds: number;
  completed: boolean;
  session_type: string;    // session category, e.g. 'guided', 'breathing'
  created_at: string;      // ISO date string
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_meditation_date: string | null;  // YYYY-MM-DD
}

interface HeatmapEntry {
  date: string;   // YYYY-MM-DD
  count: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'total_sessions' | 'streak' | 'categories';
  requirement_value: number;
  earned: boolean;
}

interface ProgressSummary {
  total_sessions: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  badges_earned: number;
}
```

---

## Identity

```ts
getDisplayName(): string | null
```
Reads `sw_display_name` from localStorage. Returns `null` if not set (first visit).

```ts
saveDisplayName(name: string): void
```
Persists the user's display name to `sw_display_name`.

---

## Preferences

```ts
getPreferences(): Preferences
```
Returns stored preferences, or defaults (`preferred_duration: 10`, `bell_sound: 'singing_bowl'`, `ambient_default: 'none'`).

```ts
savePreferences(prefs: Partial<Preferences>): Preferences
```
Merges `prefs` into current preferences, persists, and returns the merged result.

---

## Meditation Logs

```ts
getMeditationLogs(): MeditationLog[]
```
Returns the full `sw_logs` array (all time, not filtered).

```ts
appendLog(entry: Omit<MeditationLog, 'id' | 'created_at'>): MeditationLog
```
Creates a new log entry with a generated `id` and `created_at`, appends it to `sw_logs`, then automatically calls `recalculateStreak()` and `checkAndAwardBadges()`. Returns the created log.

---

## Streak

```ts
getStreak(): StreakData
```
Returns current `sw_streak` state.

```ts
recalculateStreak(): StreakData
```
Implements the streak state machine after a new log:
- `last == today` → no change (idempotent)
- `last == yesterday` → `current_streak += 1`
- `last < yesterday` or `null` → `current_streak = 1`

Updates `longest_streak` if current exceeds it. Persists and returns updated state.

---

## Badges

```ts
checkAndAwardBadges(): void
```
Evaluates all 6 badge definitions against current logs and streak. Adds newly qualified badge IDs to `sw_earned_badges`. No-ops for already-earned badges.

```ts
getBadges(): Badge[]
```
Returns all 6 badge definitions with `earned: true/false` based on `sw_earned_badges`.

### Badge Definitions

| ID | Name | Type | Threshold |
|----|------|------|-----------|
| `first_step` | First Step | `total_sessions` | 1 |
| `dedicated` | Dedicated | `total_sessions` | 50 |
| `century` | Century | `total_sessions` | 100 |
| `week_warrior` | Week Warrior | `streak` | 7 |
| `marathon` | Marathon | `streak` | 30 |
| `explorer` | Explorer | `categories` | 3 |

---

## Heatmap

```ts
getHeatmap(): HeatmapEntry[]
```
Returns daily completed-session counts for the past 365 days, sorted ascending by date. Days with zero sessions are omitted.

---

## Progress Summary

```ts
getProgressSummary(): ProgressSummary
```
Computes aggregate stats from `sw_logs` and `sw_streak`:
- `total_sessions`: count of completed logs
- `total_minutes`: sum of `duration_seconds` ÷ 60
- `current_streak` / `longest_streak`: from streak state
- `badges_earned`: size of `sw_earned_badges`

# localStorage Data Structures

All user data is stored as JSON in browser localStorage under keys prefixed `sw_`. The TypeScript interfaces are defined in `frontend/src/lib/storage.ts`.

## Key Reference

| Key | Shape | Description |
|-----|-------|-------------|
| `sw_display_name` | `string` | User's chosen name |
| `sw_preferences` | `Preferences` | Audio and session preferences |
| `sw_logs` | `MeditationLog[]` | All meditation records (append-only) |
| `sw_streak` | `StreakData` | Cached streak state (updated on each log) |
| `sw_earned_badges` | `string[]` | IDs of earned badges |

---

## `sw_preferences`

```ts
interface Preferences {
  preferred_duration: number;   // minutes
  bell_sound: string;
  ambient_default: string;
}
```

**Example:**
```json
{
  "preferred_duration": 10,
  "bell_sound": "singing_bowl",
  "ambient_default": "none"
}
```

---

## `sw_logs`

```ts
interface MeditationLog {
  id: string;              // UUID (crypto.randomUUID)
  session_id: number | null;  // null for breathing exercises
  duration_seconds: number;
  completed: boolean;
  session_type: string;    // 'guided' | 'sleep_story' | 'soundscape' | 'breathing'
  created_at: string;      // ISO 8601, e.g. "2026-03-02T14:30:00.000Z"
}
```

**Example:**
```json
[
  {
    "id": "a1b2c3d4-...",
    "session_id": 1,
    "duration_seconds": 300,
    "completed": true,
    "session_type": "guided",
    "created_at": "2026-03-02T14:30:00.000Z"
  }
]
```

---

## `sw_streak`

```ts
interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_meditation_date: string | null;  // YYYY-MM-DD
}
```

**Example:**
```json
{
  "current_streak": 5,
  "longest_streak": 12,
  "last_meditation_date": "2026-03-02"
}
```

---

## `sw_earned_badges`

An array of badge ID strings. Badge IDs are defined in `storage.ts`.

**Example:**
```json
["first_step", "week_warrior"]
```

All 6 possible IDs: `first_step`, `dedicated`, `century`, `week_warrior`, `marathon`, `explorer`.

---

## Session Data (not localStorage)

Sessions are not stored in localStorage — they're bundled as a static asset at build time:

**`frontend/src/data/sessions.json`** — 13 sessions with this shape:

```ts
interface Session {
  id: number;
  title: string;
  description: string;
  category: string;       // 'guided' | 'sleep_story' | 'soundscape'
  subcategory: string;
  duration_seconds: number;
  instructor: string | null;
  audio_url: string;
  image_url: string;
  is_daily_pick: boolean;
  tags: string[];         // e.g. ['beginner', 'stress-relief']
}
```

# Configuration

All user data and preferences are stored in browser localStorage. There is no server and no environment variables.

## localStorage Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `sw_display_name` | `string` | — | The user's chosen display name, set on first visit |
| `sw_preferences` | `Preferences` (JSON) | See below | Audio and session preferences |
| `sw_logs` | `MeditationLog[]` (JSON) | `[]` | All meditation session records |
| `sw_streak` | `StreakData` (JSON) | `{current:0, longest:0, last:null}` | Cached streak state |
| `sw_earned_badges` | `string[]` (JSON) | `[]` | IDs of earned badges |

## Preferences Object

```ts
interface Preferences {
  preferred_duration: number;   // minutes, default 10
  bell_sound: string;           // default 'singing_bowl'
  ambient_default: string;      // default 'none'
}
```

Stored under `sw_preferences`. Updated via `authStore.updatePreferences()` which calls `storage.savePreferences()`.

## Resetting Data

To clear all progress and start fresh, open the browser DevTools console and run:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('sw_'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

Or clear all site data via **DevTools → Application → Storage → Clear site data**.

# stillwater-tui

A pure-Python terminal UI for the Stillwater meditation app, built with [Textual](https://github.com/textualize/textual).

## Stack

| Concern | Tool |
|---------|------|
| UI | [Textual](https://github.com/textualize/textual) 8.x (spec `>=0.70.0`) |
| Audio | pygame ≥ 2.6 |
| Persistence | aiosqlite ≥ 0.20 — SQLite at `~/.local/share/stillwater/stillwater.db` |
| Linting | ruff |
| Package manager | uv |
| Tests | pytest + pytest-asyncio |

> **Note:** Textual's public API changed significantly between 0.x and 8.x. In particular,
> `VerticalScroll` is imported from `textual.containers`, not `textual.widgets`.

## Quickstart

```bash
cd stillwater-tui

# Install dependencies (creates .venv automatically)
uv sync

# Run the app
uv run stillwater-tui
```

First launch prompts for your name, then takes you to the home screen. Your name and all
session history are stored locally in SQLite — nothing leaves the machine.

## Key bindings

| Key | Action |
|-----|--------|
| `h` | Home |
| `l` | Library |
| `p` | Progress |
| `b` | Breathing |
| `Space` | Play / Pause current session |
| `q` | Quit |

## Audio files

Session audio streams from the URLs in `sessions.json` (e.g. `cdn.stillwater.app`). For
offline use, download MP3 files and place them under:

```
~/.local/share/stillwater/audio/
```

Ambient sounds and bell chimes use a separate sub-directory with fixed filenames:

```
~/.local/share/stillwater/audio/ambient/
  rain.mp3
  forest.mp3
  ocean.mp3
  fire.mp3
  wind.mp3
  cafe.mp3
  bell_bowl.mp3      ← singing bowl (default bell)
  bell_chime.mp3
  bell_gong.mp3
```

Missing files are silently skipped — the app runs without any audio.

## Features

- **Home** — time-of-day greeting, daily pick session card, nav shortcuts
- **Library** — 13 sessions seeded from `data/sessions.json`, filterable by category
  (All / Guided / Sleep Story / Soundscape)
- **Session detail** (modal) — full description, duration, instructor, tags, Play button
- **Player bar** — persistent footer: session title, elapsed / total time, play/pause, stop
- **Breathing** — pattern picker (Box 4-4-4-4 / 4-7-8 / Coherent 5-5), duration 3–15 min,
  30 fps animated circle; natural completion logs the session to progress
- **Progress** — current + longest streak, total sessions + minutes + categories,
  52-week activity heatmap, 6 badge types

### Badges

| ID | Name | Condition |
|----|------|-----------|
| `first_step` | First Step 🌱 | 1 completed session |
| `dedicated` | Dedicated 🧘 | 50 completed sessions |
| `century` | Century 💯 | 100 completed sessions |
| `week_warrior` | Week Warrior 🔥 | 7-day streak |
| `marathon` | Marathon 🏆 | 30-day streak |
| `explorer` | Explorer 🗺️ | Sessions from 3 different categories |

## Data

SQLite database is created at `~/.local/share/stillwater/stillwater.db` on first run.
The 13 sessions from `src/stillwater_tui/data/sessions.json` are seeded automatically
when the `sessions` table is empty. To re-seed, delete the database file.

Logs use a `session_type` column with values `"guided"`, `"sleep_story"`, `"soundscape"`,
or `"breathing"`. Only entries with `completed = 1` count toward streaks and badges.

## Development

```bash
# Lint
uv run ruff check src/ tests/

# Tests
uv run pytest tests/ -v
```

## Implementations

Both implementations live on `main`:

| Directory | Type | Stack |
|-----------|------|-------|
| `frontend/` | Browser app | Vite + React 19 + TypeScript + Tailwind v4 |
| `stillwater-tui/` | Terminal app | Python 3.12 + Textual 8 + pygame + aiosqlite |

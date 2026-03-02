# stillwater-tui

A pure-Python terminal UI for the Stillwater meditation app, built with [Textual](https://github.com/textualize/textual).

## Stack

| Concern | Tool |
|---------|------|
| UI | Textual ≥ 0.70 |
| Audio | pygame ≥ 2.6 |
| Persistence | aiosqlite (SQLite at `~/.local/share/stillwater/`) |
| Linting | ruff |
| Package manager | uv |
| Tests | pytest + pytest-asyncio |

## Quickstart

```bash
cd stillwater-tui

# Install dependencies
uv sync

# Run the app
uv run stillwater-tui
```

First launch prompts for your name, then takes you to the home screen.

## Audio files

The app streams audio from URLs stored in `sessions.json`. For offline use, place MP3 files in:

```
~/.local/share/stillwater/audio/
~/.local/share/stillwater/audio/ambient/   ← ambient sounds
```

## Key bindings

| Key | Action |
|-----|--------|
| `h` | Home |
| `l` | Library |
| `p` | Progress |
| `b` | Breathing |
| `Space` | Play / Pause |
| `q` | Quit |

## Development

```bash
# Lint
uv run ruff check src/ tests/

# Tests
uv run pytest tests/ -v
```

## Features

- **Home** — greeting + daily pick session card
- **Library** — 13 sessions, filterable by category (Guided / Sleep Story / Soundscape)
- **Session detail** — modal with full description + play button
- **Breathing** — Box / 4-7-8 / Coherent patterns, animated circle, 3–15 min durations
- **Progress** — streak, total minutes, heatmap (52 weeks), 6 badge types
- **Player bar** — persistent footer with elapsed time, play/pause, stop

## Branch

This is `explore/python-tui` — a proof-of-concept TUI rewrite.
The `main` branch contains the original FastAPI + React app.
The `explore/no-backend` branch contains the localStorage-only React app.

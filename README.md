# Stillwater

A meditation and mindfulness app with two independent implementations: a browser React app and a Python terminal app.

| Directory | Type | Stack |
|-----------|------|-------|
| `frontend/` | Browser app | Vite + React 19 + TypeScript + Tailwind v4 |
| `stillwater-tui/` | Terminal app | Python 3.12 + Textual 8 + pygame + aiosqlite |

---

## React Frontend

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript (strict), Vite 7 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| State | Zustand |
| Storage | Browser localStorage |
| Audio | Howler.js |
| Animation | Framer Motion |
| Routing | React Router v7 |

### Quick Start

**Prerequisites:** Node.js 22+, npm 10+

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (port 5173)
npm run dev
```

Open http://localhost:5173 in your browser. Enter your name when prompted to get started.

---

## Python TUI

### Tech Stack

| Concern | Tool |
|---------|------|
| UI | Textual 8.x |
| Audio | pygame ≥ 2.6 |
| Persistence | aiosqlite — SQLite at `~/.local/share/stillwater/stillwater.db` |
| Package manager | uv |
| Linting | ruff |

### Quick Start

**Prerequisites:** Python 3.12+, [uv](https://docs.astral.sh/uv/)

```bash
cd stillwater-tui

# Install dependencies
uv sync

# Run the app
uv run stillwater-tui
```

See [stillwater-tui/README.md](stillwater-tui/README.md) for key bindings, audio setup, and development commands.

---

## Features (both implementations)

### Session Library
- 13 bundled meditation sessions across 3 categories: **guided**, **sleep stories**, **soundscapes**
- Filter by category; daily pick featured on the home screen

### Audio Player
- Session playback with play/pause/seek controls
- **Ambient mixer**: 6 concurrent background sounds
- **Bell intervals**: configurable periodic chime during meditation

### Progress Tracking
- Meditation logging with automatic streak calculation
- Activity **heatmap** (52 weeks × 7 days)
- 6 **achievement badges** automatically awarded

### Breathing Exercises
- Box Breathing, 4-7-8, and Coherent Breathing patterns
- Animated breathing circle with phase transitions
- Completion auto-logs to progress tracking

---

## Documentation

- [Local testing guide](docs/testing-locally.md)
- [Architecture](docs/architecture/)
- [Python TUI readme](stillwater-tui/README.md)

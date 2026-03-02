# Stillwater

A meditation and mindfulness app. Full-stack with a FastAPI backend, React 19 frontend, and SQLite for local development.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| Database | SQLite (aiosqlite) dev / PostgreSQL (asyncpg) prod |
| Migrations | Alembic (async) |
| Auth | JWT (python-jose HS256), bcrypt passwords |
| Frontend | React 19, TypeScript (strict), Vite 7 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| State | Zustand |
| Audio | Howler.js |
| Animation | Framer Motion |
| Charts | Recharts |
| Routing | React Router v7 |

---

## Quick Start

### Prerequisites

- Python 3.12+ (installed via `uv`)
- Node.js 22+, npm 10+
- [`uv`](https://docs.astral.sh/uv/) package manager

### Backend

```bash
# Install Python dependencies
uv sync

# Seed the database with sample data
uv run python -m stillwater.seed

# Start the dev server (port 8000)
uv run uvicorn stillwater.main:app --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (port 5173, proxies /api to backend)
npm run dev
```

Open http://localhost:5173 in your browser. Register an account to get started.

---

## Features

### Session Library
- 13 pre-seeded meditation sessions across 3 categories: **guided**, **sleep stories**, **soundscapes**
- Dynamic filtering by category, subcategory, tag, duration range, and text search
- Daily pick featured on the home page

### Audio Player
- Persistent bottom bar with frosted glass effect (visible across all pages)
- Full-screen expanded mode with artwork, volume, and controls
- **Ambient mixer**: 6 concurrent sounds (rain, ocean, forest, fire, wind, birds)
- **Bell intervals**: configurable periodic bell chime during meditation
- **Media Session API**: OS-level media controls (lock screen, notification center)

### Progress Tracking
- Meditation logging with automatic streak calculation
- GitHub-style SVG **heatmap** (52 weeks × 7 days)
- 6 **achievement badges** automatically awarded

### Breathing Exercises
- Box Breathing, 4-7-8, and Coherent Breathing patterns
- Animated breathing circle with phase transitions
- Completion auto-logs to progress tracking

---

## Documentation

- [Local testing guide](docs/testing-locally.md)
- [API reference](docs/api-reference.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture/)

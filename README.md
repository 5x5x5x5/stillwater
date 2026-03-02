# Stillwater

A meditation and mindfulness app. Static-site React app — no backend required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript (strict), Vite 7 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| State | Zustand |
| Storage | Browser localStorage |
| Audio | Howler.js |
| Animation | Framer Motion |
| Charts | Recharts |
| Routing | React Router v7 |

---

## Quick Start

### Prerequisites

- Node.js 22+, npm 10+

### Run

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (port 5173)
npm run dev
```

Open http://localhost:5173 in your browser. Enter your name when prompted to get started.

---

## Features

### Session Library
- 13 bundled meditation sessions across 3 categories: **guided**, **sleep stories**, **soundscapes**
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
- All data persists in browser localStorage

### Breathing Exercises
- Box Breathing, 4-7-8, and Coherent Breathing patterns
- Animated breathing circle with phase transitions
- Completion auto-logs to progress tracking

---

## Documentation

- [Local testing guide](docs/testing-locally.md)
- [Architecture](docs/architecture/)

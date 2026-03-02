# Stillwater

A meditation and mindfulness app inspired by Headspace. Full-stack with a FastAPI backend, React 19 frontend, and SQLite for local development.

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

### Production Build

```bash
cd frontend
npm run build    # outputs to frontend/dist/
```

---

## Project Structure

```
stillwater/
├── pyproject.toml                  # Python project config, dependencies, ruff
├── .env                            # Environment variables (not committed)
├── alembic.ini                     # Alembic migration config
├── alembic/
│   └── env.py                      # Async Alembic environment
│
├── src/stillwater/
│   ├── main.py                     # FastAPI app, CORS, lifespan, router includes
│   ├── config.py                   # Pydantic Settings (env-driven)
│   ├── db.py                       # Async engine, session maker, Base, mixins
│   ├── dependencies.py             # get_current_user (JWT auth dependency)
│   ├── seed.py                     # Database seeder (sessions, tags, badges)
│   │
│   ├── models/
│   │   ├── user.py                 # User, UserPreference
│   │   ├── session.py              # Session, Tag, session_tags
│   │   └── progress.py             # MeditationLog, Streak, Badge, user_badges
│   │
│   ├── schemas/
│   │   ├── user.py                 # UserCreate, UserResponse, Token, preferences
│   │   ├── session.py              # SessionResponse, SessionListResponse, TagResponse
│   │   └── progress.py             # MeditationLogCreate, ProgressSummary, HeatmapData, BadgeResponse
│   │
│   ├── services/
│   │   ├── auth.py                 # Password hashing, JWT create/decode
│   │   ├── user.py                 # User CRUD, preference updates
│   │   ├── session.py              # Session listing, filtering, daily pick
│   │   └── progress.py             # Log meditation, streak calc, badge check, heatmap
│   │
│   └── routers/
│       ├── auth.py                 # /api/auth/*
│       ├── sessions.py             # /api/sessions/*
│       └── progress.py             # /api/progress/*
│
└── frontend/
    ├── vite.config.ts              # Vite + Tailwind plugin + API proxy
    ├── package.json
    │
    └── src/
        ├── App.tsx                 # Router setup
        ├── main.tsx                # React entry point
        ├── index.css               # Tailwind theme (colors, fonts)
        │
        ├── api/
        │   ├── client.ts           # Typed fetch wrapper with auth headers
        │   ├── auth.ts             # Auth API calls
        │   ├── sessions.ts         # Session API calls
        │   └── progress.ts         # Progress API calls
        │
        ├── stores/
        │   ├── authStore.ts        # User, token, login/register/logout
        │   ├── sessionStore.ts     # Sessions, filters, daily pick
        │   ├── playerStore.ts      # Playback state, ambient sounds, bell
        │   └── progressStore.ts    # Summary, streak, heatmap, badges
        │
        ├── hooks/
        │   ├── useAudioEngine.ts   # Howl lifecycle, RAF progress loop
        │   ├── useAmbientMixer.ts  # Multiple Howl instances for ambient sounds
        │   ├── useBellInterval.ts  # Interval-based bell chime
        │   ├── useMediaSession.ts  # OS media controls (Media Session API)
        │   └── useBreathingEngine.ts # RAF-based breathing phase state machine
        │
        ├── data/
        │   ├── ambientSounds.ts    # Rain, ocean, forest, fire, wind, birds
        │   └── breathingPatterns.ts # Box, 4-7-8, Coherent breathing patterns
        │
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── OnboardingPage.tsx
        │   ├── HomePage.tsx
        │   ├── LibraryPage.tsx
        │   ├── SessionDetailPage.tsx
        │   ├── BreathingPage.tsx
        │   └── ProgressPage.tsx
        │
        └── components/
            ├── layout/
            │   ├── AppLayout.tsx       # Sidebar (desktop) + bottom nav (mobile)
            │   └── ProtectedRoute.tsx  # Auth guard, redirects to /login
            ├── sessions/
            │   └── SessionCard.tsx     # Card with category gradient, hover animation
            ├── player/
            │   ├── PlayerBar.tsx       # Persistent bottom bar (frosted glass)
            │   ├── PlayerFullScreen.tsx # Expanded player with mixer + controls
            │   ├── AmbientMixer.tsx    # 6-sound toggle grid with volume sliders
            │   └── ProgressBar.tsx     # Clickable/draggable seek bar
            ├── breathing/
            │   ├── BreathingCircle.tsx  # Animated scale + color transitions
            │   ├── BreathingExercise.tsx # Full-screen exercise with timer
            │   └── PatternCard.tsx     # Pattern visualization with phase bars
            ├── progress/
            │   ├── Heatmap.tsx         # SVG 52x7 contribution graph
            │   ├── BadgeCard.tsx       # Earned/unearned badge display
            │   └── StreakDisplay.tsx   # Animated streak counter
            └── ui/
                └── Toast.tsx           # Toast notification system
```

---

## Architecture

### Backend

The backend follows a **router → service → model** pattern:

- **Routers** handle HTTP concerns (request parsing, status codes, error responses). They're thin wrappers that delegate to services.
- **Services** contain business logic (password hashing, streak calculation, badge checking, dynamic query building).
- **Models** are SQLAlchemy 2.0 mapped classes using the declarative style with `Mapped` type annotations.

All database operations are async. The `get_db` dependency yields an `AsyncSession` per request. In `DEBUG` mode, tables are auto-created on startup via `Base.metadata.create_all`.

Models use two shared mixins:
- **`UUIDMixin`** — adds `id: str` primary key (auto-generated UUID4 string)
- **`TimestampMixin`** — adds `created_at` and `updated_at` datetime columns

### Frontend

The frontend is a single-page app with client-side routing. Key patterns:

- **Zustand stores** manage state per domain (auth, sessions, player, progress). Stores are independent and lazily loaded by their pages.
- **API client** (`api/client.ts`) is a typed fetch wrapper that auto-injects the JWT from `localStorage` and redirects to `/login` on 401.
- **Audio hooks** isolate Howler.js lifecycle from React rendering. `useAudioEngine` manages the main Howl, `useAmbientMixer` manages 6 concurrent Howl instances, and `useBellInterval` handles periodic bell chimes.
- **Vite dev proxy** forwards `/api/*` requests to the FastAPI backend at `localhost:8000`.

### Authentication Flow

1. User registers via `POST /api/auth/register` (creates user + default preferences)
2. User logs in via `POST /api/auth/login` (returns JWT, valid for 7 days)
3. Frontend stores token in `localStorage`, includes it as `Authorization: Bearer {token}` on all API calls
4. Protected backend endpoints use the `get_current_user` dependency (decodes JWT, fetches user)
5. On 401, the API client clears the token and redirects to `/login`

---

## API Reference

Base URL: `/api`

### Health

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/health` | No | `{ status: "ok", app: "stillwater" }` |

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get JWT token |
| GET | `/api/auth/me` | Yes | Current user profile |
| GET | `/api/auth/me/preferences` | Yes | Get preferences |
| PUT | `/api/auth/me/preferences` | Yes | Update preferences |

**Register** — `POST /api/auth/register`
```json
// Request
{ "email": "user@example.com", "password": "min8chars", "display_name": "User" }

// Response (201)
{ "id": "uuid", "email": "user@example.com", "display_name": "User", "is_active": true, "created_at": "..." }
```

**Login** — `POST /api/auth/login`

Accepts JSON (`{ "email", "password" }`) or form-encoded (`username` + `password` for Swagger UI).

```json
// Response (200)
{ "access_token": "eyJ...", "token_type": "bearer" }
```

**Update Preferences** — `PUT /api/auth/me/preferences`
```json
// Request (all fields optional)
{ "preferred_duration": 15, "theme": "dark", "bell_sound": "tibetan", "ambient_default": "rain" }

// Response (200)
{ "id": "uuid", "user_id": "uuid", "preferred_duration": 15, "theme": "dark", "bell_sound": "tibetan", "ambient_default": "rain", "created_at": "...", "updated_at": "..." }
```

### Sessions (`/api/sessions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sessions` | No | List sessions (paginated, filterable) |
| GET | `/api/sessions/daily` | No | Today's daily pick |
| GET | `/api/sessions/{id}` | No | Single session detail |
| GET | `/api/sessions/categories` | No | List distinct categories |
| GET | `/api/sessions/tags` | No | List all tags |

**List Sessions** — `GET /api/sessions`

Query parameters (all optional):
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Exact match (`guided`, `sleep_story`, `soundscape`) |
| `subcategory` | string | Exact match (`stress`, `focus`, `anxiety`, `sleep`, `morning`, `evening`) |
| `tag` | string | Filter by tag name |
| `min_duration` | int | Minimum duration in seconds |
| `max_duration` | int | Maximum duration in seconds |
| `search` | string | Substring search in title and description |
| `page` | int | Page number, 1-based (default: 1) |
| `per_page` | int | Results per page, 1-100 (default: 20) |

```json
// Response
{
  "items": [
    {
      "id": "uuid", "title": "...", "description": "...",
      "category": "guided", "subcategory": "stress",
      "audio_url": "...", "image_url": "...",
      "duration_seconds": 300, "instructor": "Sarah Chen",
      "is_daily_pick": true,
      "tags": [{ "id": "uuid", "name": "beginner" }],
      "created_at": "..."
    }
  ],
  "total": 13, "page": 1, "per_page": 20
}
```

### Progress (`/api/progress`)

All endpoints require authentication.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/progress/log` | Yes | Log a completed meditation |
| GET | `/api/progress/summary` | Yes | Aggregate stats |
| GET | `/api/progress/streak` | Yes | Streak info |
| GET | `/api/progress/heatmap` | Yes | Daily counts (365 days) |
| GET | `/api/progress/badges` | Yes | All badges with earned status |

**Log Meditation** — `POST /api/progress/log`

Automatically updates the user's streak and checks for newly earned badges.

```json
// Request
{ "session_id": "uuid-or-null", "duration_seconds": 300, "completed": true, "session_type": "guided" }

// Response (201)
{ "id": "uuid", "user_id": "uuid", "session_id": "...", "duration_seconds": 300, "completed": true, "session_type": "guided", "created_at": "...", "updated_at": "..." }
```

**Summary** — `GET /api/progress/summary`
```json
{ "total_sessions": 42, "total_minutes": 315, "current_streak": 7, "longest_streak": 14, "badges_earned": 3 }
```

**Heatmap** — `GET /api/progress/heatmap`
```json
[{ "date": "2026-02-28", "count": 2 }, { "date": "2026-03-01", "count": 1 }]
```
Days with zero sessions are omitted.

**Badges** — `GET /api/progress/badges`
```json
[{ "id": "uuid", "name": "First Step", "description": "Complete your first session.", "icon": "🌱", "requirement_type": "total_sessions", "requirement_value": 1, "earned": true }]
```

---

## Database Schema

9 tables total. All primary keys are UUID strings.

### users

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR (UUID) | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL, indexed |
| hashed_password | VARCHAR(255) | NOT NULL |
| display_name | VARCHAR(100) | NOT NULL |
| is_active | BOOLEAN | DEFAULT TRUE |
| created_at | DATETIME | DEFAULT now() |
| updated_at | DATETIME | DEFAULT now() |

### user_preferences

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR (UUID) | PK |
| user_id | VARCHAR (FK) | UNIQUE, NOT NULL → users.id |
| preferred_duration | INTEGER | DEFAULT 10 |
| theme | VARCHAR(20) | DEFAULT "dark" |
| bell_sound | VARCHAR(50) | DEFAULT "tibetan" |
| ambient_default | VARCHAR(50) | DEFAULT "none" |
| created_at | DATETIME | DEFAULT now() |
| updated_at | DATETIME | DEFAULT now() |

### sessions

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR (UUID) | PK |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | nullable |
| category | VARCHAR(50) | NOT NULL, indexed |
| subcategory | VARCHAR(50) | nullable |
| audio_url | VARCHAR(500) | nullable |
| image_url | VARCHAR(500) | nullable |
| duration_seconds | INTEGER | NOT NULL |
| instructor | VARCHAR(100) | nullable |
| is_daily_pick | BOOLEAN | DEFAULT FALSE |
| created_at | DATETIME | DEFAULT now() |
| updated_at | DATETIME | DEFAULT now() |

### tags

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR (UUID) | PK |
| name | VARCHAR(50) | UNIQUE, NOT NULL |

### session_tags

| Column | Type | Constraints |
|--------|------|-------------|
| session_id | VARCHAR (FK) | PK → sessions.id |
| tag_id | VARCHAR (FK) | PK → tags.id |

### meditation_logs

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR (UUID) | PK |
| user_id | VARCHAR (FK) | NOT NULL, indexed → users.id |
| session_id | VARCHAR (FK) | nullable → sessions.id |
| duration_seconds | INTEGER | NOT NULL |
| completed | BOOLEAN | DEFAULT TRUE |
| session_type | VARCHAR(50) | DEFAULT "guided" |
| created_at | DATETIME | DEFAULT now() |
| updated_at | DATETIME | DEFAULT now() |

### streaks

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR (UUID) | PK |
| user_id | VARCHAR (FK) | UNIQUE, NOT NULL → users.id |
| current_streak | INTEGER | DEFAULT 0 |
| longest_streak | INTEGER | DEFAULT 0 |
| last_meditation_date | DATE | nullable |

### badges

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR (UUID) | PK |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| description | TEXT | NOT NULL |
| icon | VARCHAR(50) | NOT NULL |
| requirement_type | VARCHAR(50) | NOT NULL |
| requirement_value | INTEGER | NOT NULL |

### user_badges

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | VARCHAR (FK) | PK → users.id |
| badge_id | VARCHAR (FK) | PK → badges.id |

**Relationships:**
- User ←→ UserPreference (1:1)
- User ←→ Streak (1:1)
- User ←→ MeditationLog (1:N)
- User ←→ Badge (M:N via user_badges)
- Session ←→ Tag (M:N via session_tags)
- MeditationLog → Session (N:1, optional)

---

## Frontend Routes

| Path | Page | Auth | Layout |
|------|------|------|--------|
| `/login` | LoginPage | Public | None |
| `/register` | RegisterPage | Public | None |
| `/onboarding` | OnboardingPage | Protected | None |
| `/home` | HomePage | Protected | AppLayout |
| `/library` | LibraryPage | Protected | AppLayout |
| `/sessions/:id` | SessionDetailPage | Protected | AppLayout |
| `/breathe` | BreathingPage | Protected | AppLayout |
| `/progress` | ProgressPage | Protected | AppLayout |
| `/` | Redirect | — | → `/home` or `/login` |
| `*` | Redirect | — | → `/` |

**AppLayout** provides:
- Sidebar navigation on desktop (`md:` breakpoint and up)
- Bottom navigation bar on mobile
- Persistent audio player bar (visible when a session is loaded)

---

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#1B1F3B` | Primary background |
| `navy-light` | `#2A2F52` | Cards, elevated surfaces |
| `navy-dark` | `#12152A` | Deeper backgrounds, overlays |
| `lavender` | `#C4B5E0` | Primary accent, guided sessions |
| `lavender-light` | `#D8CCF0` | Hover states |
| `lavender-dark` | `#A08CC8` | Active states |
| `sand` | `#F5E6CC` | Secondary accent, exhale phase |
| `sand-light` | `#FAF0E0` | Highlights |
| `sand-dark` | `#E8D4B0` | Muted sand |
| `sage` | `#A8C5A0` | Success, streaks, soundscape sessions |
| `sage-light` | `#C0D8BA` | Heatmap levels |
| `sage-dark` | `#8BAF82` | Heatmap darkest |
| `offwhite` | `#FAF9F6` | Primary text |
| `error` | `#E57373` | Error states |
| `warning` | `#FFB74D` | Warning states |

### Typography

| Token | Stack |
|-------|-------|
| `font-sans` | Inter, system-ui, -apple-system, sans-serif |
| `font-serif` | Lora, Georgia, serif |

Body defaults: `bg-navy text-offwhite font-sans antialiased`

### Category Color Mapping

| Category | Gradient |
|----------|----------|
| Guided | Lavender tones |
| Sleep Story | Navy tones |
| Soundscape | Sage tones |

---

## Features

### Session Library
- 13 pre-seeded meditation sessions across 3 categories: **guided**, **sleep stories**, **soundscapes**
- 6 subcategories: stress, focus, anxiety, sleep, morning, evening
- Dynamic filtering by category, subcategory, tag, duration range, and text search
- Paginated results
- Daily pick featured on the home page

### Audio Player
- **Howler.js** for HTML5 audio playback with Web Audio API fallback
- Persistent bottom bar with frosted glass effect (visible across all pages)
- Full-screen expanded mode with artwork, volume, and controls
- **Ambient mixer**: 6 concurrent sounds (rain, ocean, forest, fire, wind, birds) with independent volume sliders
- **Bell intervals**: configurable periodic bell chime during meditation
- **Media Session API**: OS-level media controls (lock screen, notification center)
- `requestAnimationFrame`-based progress tracking (no polling)

### Progress Tracking
- Meditation logging with automatic streak calculation
- **Streak logic**: increments if last meditation was yesterday, resets if gap > 1 day, no double-count for same day
- GitHub-style SVG **heatmap** (52 weeks x 7 days, sage green color scale)
- 6 **achievement badges** automatically awarded:

| Badge | Requirement |
|-------|-------------|
| First Step | 1 session completed |
| Dedicated | 50 sessions completed |
| Century | 100 sessions completed |
| Week Warrior | 7-day streak |
| Marathon | 30-day streak |
| Explorer | 3 different session types |

### Breathing Exercises
- 3 pre-built patterns:
  - **Box Breathing** (4s inhale, 4s hold, 4s exhale, 4s hold)
  - **4-7-8 Relaxing** (4s inhale, 7s hold, 8s exhale)
  - **Coherent Breathing** (5.5s inhale, 5.5s exhale)
- Animated breathing circle (Framer Motion): scales 1.0→1.6 on inhale, with color transitions per phase
- Configurable duration (1-10 minutes)
- Completion auto-logs to progress tracking

---

## Seed Data

Run `uv run python -m stillwater.seed` to populate the database. This creates:

**12 tags**: beginner, intermediate, advanced, stress-relief, focus, sleep, morning, evening, nature, breathwork, body-scan, visualization

**13 sessions**:

| Title | Category | Duration | Instructor |
|-------|----------|----------|------------|
| 5-Minute Breath Reset | guided (stress) | 5 min | Sarah Chen |
| Letting Go of Stress | guided (stress) | 15 min | Sarah Chen |
| Deep Focus Flow | guided (focus) | 10 min | Marcus Webb |
| Clarity Visualization | guided (focus) | 20 min | Marcus Webb |
| Calm the Storm | guided (anxiety) | 12 min | Priya Nair |
| Sunrise Intention Setting | guided (morning) | 10 min | Priya Nair |
| Evening Wind-Down | guided (evening) | 15 min | Sarah Chen |
| The Forest Cabin | sleep_story (sleep) | 30 min | James Holloway |
| Stargazing on the Hillside | sleep_story (sleep) | 25 min | James Holloway |
| The Quiet Library | sleep_story (sleep) | 35 min | Amara Osei |
| Ocean Tide at Midnight | soundscape (sleep) | 60 min | — |
| Mountain Rain | soundscape (focus) | 45 min | — |
| Dawn Chorus | soundscape (morning) | 20 min | — |

**6 badges**: First Step, Dedicated, Century, Week Warrior, Marathon, Explorer

The daily pick is set to "5-Minute Breath Reset".

---

## Configuration

All backend settings are read from environment variables (with `.env` file support via pydantic-settings).

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./stillwater.db` | Database connection string |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | JWT signing key |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `DEBUG` | `true` | Enables auto table creation, SQL echo |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | JWT expiration |

For production, switch to PostgreSQL:
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/stillwater
```

The schema avoids PostgreSQL-only features (no `ARRAY`, no `tsvector`), so switching databases requires no code changes.

---

## Future Phases

The following features are planned but not yet implemented. The existing database schema and models are designed to accommodate them without structural rework.

- **Phase 6**: Courses (multi-session guided programs)
- **Phase 7**: Mood tracking (pre/post session mood logging, mood chart)
- **Phase 8**: Unguided timer (custom duration, bells only)
- **Phase 9**: Sleep mode (screen dimming, auto-stop)
- **Phase 10**: Search and discover (recommendations, trending)
- **Phase 11**: Polish (performance, accessibility audit, PWA)

# Testing Stillwater Locally

A step-by-step guide for running the Stillwater meditation app on your machine and verifying every feature.

---

## 1. Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Python | 3.12 | `python3 --version` |
| Node.js | 22 | `node -v` |
| npm | 10 | `npm -v` |
| uv | latest | `uv --version` |

Install `uv` if you don't have it:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## 2. Initial Setup

```bash
# Clone the repo (or navigate to your existing checkout)
cd stillwater

# Install Python dependencies
uv sync

# Install frontend dependencies
cd frontend && npm install && cd ..
```

The default `.env` ships with working dev values — no changes needed:

```
DATABASE_URL=sqlite+aiosqlite:///./stillwater.db
SECRET_KEY=dev-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5173
DEBUG=true
```

---

## 3. Start the App

You need **two terminals** running side by side.

**Terminal 1 — Backend (port 8000):**

```bash
uv run uvicorn stillwater.main:app --reload
```

**Terminal 2 — Frontend (port 5173):**

```bash
cd frontend && npm run dev
```

Verify the backend is up:

```bash
curl -s localhost:8000/api/health | jq
```

Expected:

```json
{
  "status": "ok",
  "app": "stillwater"
}
```

The frontend dev server proxies all `/api/*` requests to `localhost:8000`, so you only need to open **http://localhost:5173** in your browser.

---

## 4. Seed the Database

```bash
uv run python -m stillwater.seed
```

> **Warning:** The seed script drops and recreates all tables. Any existing data (users, logs) will be deleted.

This creates:

| Data | Count | Examples |
|------|-------|---------|
| Tags | 12 | beginner, stress-relief, focus, sleep, nature, breathwork... |
| Sessions | 13 | Guided meditations, sleep stories, soundscapes (5–60 min) |
| Badges | 6 | First Step, Dedicated, Century, Week Warrior, Marathon, Explorer |
| Daily pick | 1 | "5-Minute Breath Reset" by Sarah Chen |

---

## 5. Test Each Feature

### 5a. Authentication

1. Open **http://localhost:5173/register**
2. Fill in:
   - **Email** — any valid email format
   - **Password** — 8 characters minimum
   - **Display name** — any non-blank text
3. Submit — you should be redirected to `/home`
4. Log out (if available), then open **http://localhost:5173/login**
5. Log in with the same credentials — verify redirect to `/home`

**API verification:**

```bash
# Register via API
curl -s localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass1","display_name":"Tester"}' | jq

# Login and capture token
TOKEN=$(curl -s localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass1"}' | jq -r '.access_token')

echo $TOKEN

# Check current user
curl -s localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 5b. Session Library

1. Navigate to **http://localhost:5173/library**
2. Browse the 13 seeded sessions
3. **Filter by category** — use the category dropdown (guided, sleep_story, soundscape)
4. **Search** — type a keyword (e.g. "forest") in the search box
5. **Filter by tag** — click tag chips (e.g. beginner, sleep)
6. **Session detail** — click any session card to open `/sessions/:id`
7. Go to **http://localhost:5173/home** — verify the daily pick card appears ("5-Minute Breath Reset")

### 5c. Audio Player

1. Click **Play** on any session — the PlayerBar should appear at the bottom of the screen
2. Test **play/pause** toggle
3. Test **progress bar** — click or drag to seek
4. **Expand the player** — test the volume slider
5. **Ambient mixer** — toggle ambient sounds (rain, ocean, etc.)
6. **Bell interval** — set a bell interval and listen for the chime
7. Let a short session play to completion — it should auto-log to your progress

> **Note:** Audio files point to `cdn.stillwater.app` which won't resolve locally. The player UI still works for testing controls — you just won't hear actual audio unless you provide local files.

### 5d. Progress Tracking

1. Navigate to **http://localhost:5173/progress**
2. Verify the page loads with:
   - **Streak counter** (0 if no sessions logged yet)
   - **Heatmap** (empty grid for the past year)
   - **Badges** (6 badges, all unearned initially)
3. Log a meditation (via API or by playing a session), then refresh
4. The **"First Step"** badge (1 session) should now show as earned
5. Streak counter should update to 1

**Quick log via API:**

```bash
curl -s localhost:8000/api/progress/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_seconds":300,"completed":true,"session_type":"guided"}' | jq
```

### 5e. Breathing Exercises

1. Navigate to **http://localhost:5173/breathe**
2. Three patterns are available:

   | Pattern | Cycle | Phases |
   |---------|-------|--------|
   | Box Breathing | 16s | Inhale 4s → Hold 4s → Exhale 4s → Hold 4s |
   | 4-7-8 Relaxing | 19s | Inhale 4s → Hold 7s → Exhale 8s |
   | Coherent Breathing | 11s | Inhale 5.5s → Exhale 5.5s |

3. Select **Box Breathing**
4. Set duration to **1 minute** (shortest, for quick testing)
5. Click **Start** — verify:
   - The circle animates (expanding on inhale, contracting on exhale)
   - The phase label changes (Inhale → Hold → Exhale → Hold)
   - The countdown timer ticks down
6. Click **Pause** — animation and timer should freeze
7. Click **Resume** — timing should continue from where it stopped
8. Let it complete — verify the completion summary appears and the session is logged to progress

---

## 6. API Smoke Tests

Run these in sequence. Each command builds on the previous one.

```bash
# 1. Health check
curl -s localhost:8000/api/health | jq

# 2. Register a user
curl -s localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"smoketest1","display_name":"Smoke"}' | jq

# 3. Login and capture token
TOKEN=$(curl -s localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"smoketest1"}' | jq -r '.access_token')

# 4. List sessions (first page)
curl -s localhost:8000/api/sessions | jq

# 5. List sessions filtered by category
curl -s "localhost:8000/api/sessions?category=guided" | jq

# 6. Get all tags
curl -s localhost:8000/api/sessions/tags | jq

# 7. Get daily pick
curl -s localhost:8000/api/sessions/daily | jq

# 8. Log a meditation
curl -s localhost:8000/api/progress/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_seconds":600,"completed":true,"session_type":"guided"}' | jq

# 9. Get progress summary
curl -s localhost:8000/api/progress/summary \
  -H "Authorization: Bearer $TOKEN" | jq

# 10. Get heatmap
curl -s localhost:8000/api/progress/heatmap \
  -H "Authorization: Bearer $TOKEN" | jq

# 11. Get badges
curl -s localhost:8000/api/progress/badges \
  -H "Authorization: Bearer $TOKEN" | jq

# 12. Get streak
curl -s localhost:8000/api/progress/streak \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 7. Swagger UI

1. Open **http://localhost:8000/docs** in your browser
2. Click **Authorize** (lock icon at the top)
3. Enter `username` (your email) and `password`, then click **Authorize**
4. Try any endpoint interactively — the UI sends your token automatically

---

## 8. Linting

```bash
# Backend (ruff)
uv run ruff check src/

# Frontend (ESLint)
cd frontend && npm run lint
```

Both should exit with zero errors on a clean checkout.

---

## 9. Troubleshooting

**Port already in use (8000 or 5173)**

```bash
# Find what's using the port
lsof -i :8000
# Kill it
kill -9 <PID>
```

Or start on a different port:

```bash
# Backend on port 8001
uv run uvicorn stillwater.main:app --reload --port 8001

# Frontend on port 3000
cd frontend && npm run dev -- --port 3000
```

> If you change the backend port, update `CORS_ORIGINS` in `.env` and the proxy target in `frontend/vite.config.ts`.

**Database reset**

```bash
rm stillwater.db
uv run python -m stillwater.seed
```

**CORS errors in the browser console**

Make sure **both** servers are running. The frontend proxies `/api` to the backend — if the backend is down, requests fail. Also ensure `CORS_ORIGINS` in `.env` matches the frontend URL (`http://localhost:5173`).

**"401 Unauthorized" on protected endpoints**

Tokens expire after 7 days. Log in again to get a fresh token. If using `curl`, make sure the `Authorization: Bearer <token>` header is correct (no extra whitespace, no quotes around the token value).

**Seed script errors**

If the seed script fails, delete the database file and try again:

```bash
rm -f stillwater.db
uv run python -m stillwater.seed
```

**Frontend shows blank page**

Check the browser console for errors. Common causes:
- Backend not running (API calls fail)
- Not seeded yet (no sessions to display)
- Wrong Node version (need 22+)

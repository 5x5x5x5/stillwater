# API Reference

Base URL: `/api`

---

## Health

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/health` | No | `{ status: "ok", app: "stillwater" }` |

---

## Auth (`/api/auth`)

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

---

## Sessions (`/api/sessions`)

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

---

## Progress (`/api/progress`)

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

## Interactive API Explorer

The backend exposes a Swagger UI at **http://localhost:8000/docs** when running locally. Click **Authorize** and enter your credentials to try endpoints interactively.

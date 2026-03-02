# Database Schema

Entity-relationship diagram for all 9 tables in the Stillwater database.

## ER Diagram

```mermaid
erDiagram
    users {
        string id PK "UUID"
        string email UK "unique, indexed, lowercase"
        string hashed_password "bcrypt hash"
        string display_name
        boolean is_active "default true"
        datetime created_at
        datetime updated_at
    }

    user_preferences {
        string id PK "UUID"
        string user_id FK "unique, → users.id"
        integer preferred_duration "default 10 (minutes)"
        string theme "default 'dark'"
        string bell_sound "default 'tibetan'"
        string ambient_default "default 'none'"
        datetime created_at
        datetime updated_at
    }

    sessions {
        string id PK "UUID"
        string title
        text description "nullable"
        string category "indexed (guided, sleep_story, ...)"
        string subcategory "nullable"
        string audio_url "nullable"
        string image_url "nullable"
        integer duration_seconds
        string instructor "nullable"
        boolean is_daily_pick "default false"
        datetime created_at
        datetime updated_at
    }

    tags {
        string id PK "UUID"
        string name UK "unique"
    }

    session_tags {
        string session_id PK,FK "→ sessions.id"
        string tag_id PK,FK "→ tags.id"
    }

    meditation_logs {
        string id PK "UUID"
        string user_id FK "indexed, → users.id"
        string session_id FK "nullable, → sessions.id"
        integer duration_seconds
        boolean completed "default true"
        string session_type "default 'guided'"
        datetime created_at
        datetime updated_at
    }

    streaks {
        string id PK "UUID"
        string user_id FK "unique, → users.id"
        integer current_streak "default 0"
        integer longest_streak "default 0"
        date last_meditation_date "nullable"
    }

    badges {
        string id PK "UUID"
        string name UK "unique"
        text description
        string icon "emoji identifier"
        string requirement_type "total_sessions | streak | categories"
        integer requirement_value "threshold"
    }

    user_badges {
        string user_id PK,FK "→ users.id"
        string badge_id PK,FK "→ badges.id"
    }

    users ||--o| user_preferences : "has one"
    users ||--o| streaks : "has one"
    users ||--o{ meditation_logs : "has many"
    users }o--o{ badges : "earned via user_badges"
    sessions }o--o{ tags : "tagged via session_tags"
    meditation_logs }o--o| sessions : "references"
```

## Table Summary

| Table | Rows (seeded) | Purpose |
|-------|---------------|---------|
| `users` | — | User accounts |
| `user_preferences` | — | Per-user settings (1:1 with users) |
| `sessions` | 13 | Meditation content library |
| `tags` | ~10 | Session categorization labels |
| `session_tags` | — | M:N join for sessions ↔ tags |
| `meditation_logs` | — | Individual meditation records |
| `streaks` | — | Cached streak data (1:1 with users) |
| `badges` | 6 | Achievement definitions |
| `user_badges` | — | M:N join for users ↔ badges |

## Mixins

All models with `created_at`/`updated_at` use **TimestampMixin**. All primary keys use **UUIDMixin** (string UUID, auto-generated via `uuid4`).

## Notes

- String UUIDs used instead of native UUID type for SQLite compatibility
- `session_id` in `meditation_logs` is nullable — breathing exercises log without a session reference
- `session_type` in `meditation_logs` mirrors session category but is stored independently for free-form entries
- Cascade deletes configured: deleting a user removes their preferences, logs, streak, and badge associations

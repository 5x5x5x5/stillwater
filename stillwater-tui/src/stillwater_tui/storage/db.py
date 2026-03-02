"""Database initialization and schema management."""

from __future__ import annotations

import json
from pathlib import Path

import aiosqlite

DB_DIR = Path.home() / ".local" / "share" / "stillwater"
DB_PATH = DB_DIR / "stillwater.db"

DATA_DIR = Path(__file__).parent.parent / "data"


async def get_connection() -> aiosqlite.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    return await aiosqlite.connect(DB_PATH)


async def init_db() -> None:
    """Create tables if not exist and seed sessions from JSON."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                subcategory TEXT,
                duration_seconds INTEGER,
                instructor TEXT,
                audio_url TEXT,
                image_url TEXT,
                is_daily_pick INTEGER DEFAULT 0,
                tags_json TEXT DEFAULT '[]'
            );

            CREATE TABLE IF NOT EXISTS logs (
                id TEXT PRIMARY KEY,
                session_id INTEGER,
                duration_seconds INTEGER,
                completed INTEGER DEFAULT 1,
                session_type TEXT DEFAULT 'guided',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS streak (
                id INTEGER PRIMARY KEY DEFAULT 1,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_meditation_date TEXT
            );

            CREATE TABLE IF NOT EXISTS earned_badges (
                badge_id TEXT PRIMARY KEY
            );

            CREATE TABLE IF NOT EXISTS preferences (
                id INTEGER PRIMARY KEY DEFAULT 1,
                preferred_duration INTEGER DEFAULT 10,
                bell_sound TEXT DEFAULT 'singing_bowl',
                ambient_default TEXT DEFAULT 'none'
            );

            CREATE TABLE IF NOT EXISTS identity (
                id INTEGER PRIMARY KEY DEFAULT 1,
                display_name TEXT
            );
        """)

        # Seed streak row if missing
        await db.execute(
            "INSERT OR IGNORE INTO streak"
            " (id, current_streak, longest_streak, last_meditation_date)"
            " VALUES (1, 0, 0, NULL)"
        )

        # Seed sessions if table is empty
        row = await db.execute("SELECT COUNT(*) FROM sessions")
        count = (await row.fetchone())[0]
        if count == 0:
            sessions_file = DATA_DIR / "sessions.json"
            sessions = json.loads(sessions_file.read_text())
            for s in sessions:
                await db.execute(
                    """INSERT OR IGNORE INTO sessions
                       (id, title, description, category, subcategory, duration_seconds,
                        instructor, audio_url, image_url, is_daily_pick, tags_json)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        s["id"],
                        s["title"],
                        s.get("description", ""),
                        s.get("category", "guided"),
                        s.get("subcategory", ""),
                        s.get("duration_seconds", 0),
                        s.get("instructor"),
                        s.get("audio_url", ""),
                        s.get("image_url", ""),
                        1 if s.get("is_daily_pick") else 0,
                        json.dumps(s.get("tags", [])),
                    ),
                )

        await db.commit()


async def get_identity() -> str | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT display_name FROM identity WHERE id = 1") as cur:
            row = await cur.fetchone()
            return row["display_name"] if row else None


async def set_identity(name: str) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR REPLACE INTO identity (id, display_name) VALUES (1, ?)", (name,)
        )
        await db.commit()


async def get_all_sessions() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM sessions ORDER BY id") as cur:
            rows = await cur.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["tags"] = json.loads(d.pop("tags_json", "[]"))
        d["is_daily_pick"] = bool(d["is_daily_pick"])
        result.append(d)
    return result


async def get_session(session_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
            row = await cur.fetchone()
    if not row:
        return None
    d = dict(row)
    d["tags"] = json.loads(d.pop("tags_json", "[]"))
    d["is_daily_pick"] = bool(d["is_daily_pick"])
    return d


async def get_daily_pick() -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM sessions WHERE is_daily_pick = 1 LIMIT 1"
        ) as cur:
            row = await cur.fetchone()
    if not row:
        return None
    d = dict(row)
    d["tags"] = json.loads(d.pop("tags_json", "[]"))
    d["is_daily_pick"] = True
    return d

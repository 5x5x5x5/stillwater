"""Progress tracking: logs, streaks, badges, heatmap.

Direct port of frontend/src/lib/storage.ts logic.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta

import aiosqlite

from .db import DB_PATH

# ---------------------------------------------------------------------------
# Badge definitions (mirrors storage.ts)
# ---------------------------------------------------------------------------

BADGES = [
    {
        "id": "first_step",
        "name": "First Step",
        "description": "Complete your first meditation session",
        "icon": "🌱",
        "type": "total_sessions",
        "threshold": 1,
    },
    {
        "id": "dedicated",
        "name": "Dedicated",
        "description": "Complete 50 meditation sessions",
        "icon": "🧘",
        "type": "total_sessions",
        "threshold": 50,
    },
    {
        "id": "century",
        "name": "Century",
        "description": "Complete 100 meditation sessions",
        "icon": "💯",
        "type": "total_sessions",
        "threshold": 100,
    },
    {
        "id": "week_warrior",
        "name": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "icon": "🔥",
        "type": "streak",
        "threshold": 7,
    },
    {
        "id": "marathon",
        "name": "Marathon",
        "description": "Maintain a 30-day streak",
        "icon": "🏆",
        "type": "streak",
        "threshold": 30,
    },
    {
        "id": "explorer",
        "name": "Explorer",
        "description": "Try 3 different session categories",
        "icon": "🗺️",
        "type": "categories",
        "threshold": 3,
    },
]


# ---------------------------------------------------------------------------
# Log helpers
# ---------------------------------------------------------------------------


async def append_log(
    session_id: int | None,
    duration_seconds: int,
    completed: bool = True,
    session_type: str = "guided",
) -> str:
    """Insert a meditation log entry, then update streak and badges."""
    entry_id = str(uuid.uuid4())
    now = datetime.now(UTC).isoformat()

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO logs"
            " (id, session_id, duration_seconds, completed, session_type, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (entry_id, session_id, duration_seconds, 1 if completed else 0, session_type, now),
        )
        await db.commit()

    await recalculate_streak()
    await check_and_award_badges()
    return entry_id


# ---------------------------------------------------------------------------
# Streak
# ---------------------------------------------------------------------------


def _date_from_iso(iso: str) -> date:
    return datetime.fromisoformat(iso).date()


async def recalculate_streak() -> None:
    """Recalculate current and longest streak from all completed logs."""
    async with aiosqlite.connect(DB_PATH) as db:
        # Get distinct dates with completed sessions, sorted descending
        async with db.execute(
            """SELECT DISTINCT date(created_at) as d
               FROM logs
               WHERE completed = 1
               ORDER BY d DESC"""
        ) as cur:
            rows = await cur.fetchall()

        if not rows:
            await db.execute(
                "UPDATE streak SET current_streak=0, longest_streak=0,"
                " last_meditation_date=NULL WHERE id=1"
            )
            await db.commit()
            return

        dates = [date.fromisoformat(r[0]) for r in rows]
        today = date.today()

        # Compute current streak (must include today or yesterday to be active)
        current_streak = 0
        if dates[0] >= today - timedelta(days=1):
            current_streak = 1
            for i in range(1, len(dates)):
                if (dates[i - 1] - dates[i]).days == 1:
                    current_streak += 1
                else:
                    break

        # Compute longest streak
        longest_streak = 0
        run = 1
        for i in range(1, len(dates)):
            if (dates[i - 1] - dates[i]).days == 1:
                run += 1
                longest_streak = max(longest_streak, run)
            else:
                run = 1
        longest_streak = max(longest_streak, run, current_streak)

        last_date = dates[0].isoformat()
        await db.execute(
            """UPDATE streak
               SET current_streak=?, longest_streak=?, last_meditation_date=?
               WHERE id=1""",
            (current_streak, longest_streak, last_date),
        )
        await db.commit()


async def get_streak() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM streak WHERE id=1") as cur:
            row = await cur.fetchone()
    if not row:
        return {"current_streak": 0, "longest_streak": 0, "last_meditation_date": None}
    return dict(row)


# ---------------------------------------------------------------------------
# Badges
# ---------------------------------------------------------------------------


async def check_and_award_badges() -> list[str]:
    """Evaluate badge conditions and persist newly earned badges. Returns new badge IDs."""
    summary = await get_progress_summary()
    streak_data = await get_streak()

    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT badge_id FROM earned_badges") as cur:
            earned = {r[0] for r in await cur.fetchall()}

        newly_earned = []
        for badge in BADGES:
            if badge["id"] in earned:
                continue
            earned_it = False
            if badge["type"] == "total_sessions":
                earned_it = summary["total_sessions"] >= badge["threshold"]
            elif badge["type"] == "streak":
                earned_it = streak_data["longest_streak"] >= badge["threshold"]
            elif badge["type"] == "categories":
                earned_it = summary["categories_explored"] >= badge["threshold"]

            if earned_it:
                await db.execute(
                    "INSERT OR IGNORE INTO earned_badges (badge_id) VALUES (?)", (badge["id"],)
                )
                newly_earned.append(badge["id"])

        await db.commit()
    return newly_earned


async def get_badges() -> list[dict]:
    """Return all badge definitions with earned status."""
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT badge_id FROM earned_badges") as cur:
            earned = {r[0] for r in await cur.fetchall()}
    return [{"earned": b["id"] in earned, **b} for b in BADGES]


# ---------------------------------------------------------------------------
# Progress summary
# ---------------------------------------------------------------------------


async def get_progress_summary() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT COUNT(*), SUM(duration_seconds) FROM logs WHERE completed=1"
        ) as cur:
            row = await cur.fetchone()
        total_sessions = row[0] or 0
        total_seconds = row[1] or 0

        async with db.execute(
            """SELECT COUNT(DISTINCT s.category)
               FROM logs l
               JOIN sessions s ON l.session_id = s.id
               WHERE l.completed=1"""
        ) as cur:
            cat_row = await cur.fetchone()
        categories_explored = cat_row[0] or 0

    return {
        "total_sessions": total_sessions,
        "total_minutes": total_seconds // 60,
        "categories_explored": categories_explored,
    }


# ---------------------------------------------------------------------------
# Heatmap
# ---------------------------------------------------------------------------


async def get_heatmap() -> dict[str, int]:
    """Return a dict mapping date strings (YYYY-MM-DD) → session count for last 365 days."""
    cutoff = (date.today() - timedelta(days=364)).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            """SELECT date(created_at) as d, COUNT(*) as cnt
               FROM logs
               WHERE completed=1 AND date(created_at) >= ?
               GROUP BY d""",
            (cutoff,),
        ) as cur:
            rows = await cur.fetchall()
    return {r[0]: r[1] for r in rows}

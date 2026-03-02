"""Seed script: populate the database with demo sessions, tags, and badges.

Run with:
    uv run python -m stillpoint.seed
"""

import asyncio
import uuid

from stillpoint.db import Base, async_session, engine
from stillpoint.models.progress import Badge
from stillpoint.models.session import Session, Tag


def _id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Tag definitions
# ---------------------------------------------------------------------------

TAG_NAMES = [
    "beginner",
    "intermediate",
    "advanced",
    "stress-relief",
    "focus",
    "sleep",
    "morning",
    "evening",
    "nature",
    "breathwork",
    "body-scan",
    "visualization",
]

# ---------------------------------------------------------------------------
# Session definitions
# ---------------------------------------------------------------------------
# Each entry maps to Session constructor kwargs plus a list of tag names.

SESSION_DATA: list[dict] = [
    # ── Guided / Stress ────────────────────────────────────────────────────
    {
        "title": "5-Minute Breath Reset",
        "description": (
            "A quick guided session to release tension and reset your nervous "
            "system using simple breathing techniques."
        ),
        "category": "guided",
        "subcategory": "stress",
        "duration_seconds": 5 * 60,
        "instructor": "Sarah Chen",
        "audio_url": "https://cdn.stillpoint.app/audio/breath-reset.mp3",
        "image_url": "https://cdn.stillpoint.app/images/breath-reset.jpg",
        "is_daily_pick": True,
        "tags": ["beginner", "stress-relief", "breathwork"],
    },
    {
        "title": "Letting Go of Stress",
        "description": (
            "A 15-minute guided body-scan that melts away the tension carried "
            "in muscles and joints after a long day."
        ),
        "category": "guided",
        "subcategory": "stress",
        "duration_seconds": 15 * 60,
        "instructor": "Sarah Chen",
        "audio_url": "https://cdn.stillpoint.app/audio/letting-go.mp3",
        "image_url": "https://cdn.stillpoint.app/images/letting-go.jpg",
        "is_daily_pick": False,
        "tags": ["intermediate", "stress-relief", "body-scan"],
    },
    # ── Guided / Focus ────────────────────────────────────────────────────
    {
        "title": "Deep Focus Flow",
        "description": (
            "Train single-pointed concentration with this 10-minute attention "
            "anchoring meditation. Ideal before important work."
        ),
        "category": "guided",
        "subcategory": "focus",
        "duration_seconds": 10 * 60,
        "instructor": "Marcus Webb",
        "audio_url": "https://cdn.stillpoint.app/audio/deep-focus.mp3",
        "image_url": "https://cdn.stillpoint.app/images/deep-focus.jpg",
        "is_daily_pick": False,
        "tags": ["intermediate", "focus"],
    },
    {
        "title": "Clarity Visualization",
        "description": (
            "Use guided imagery to clear mental fog and step into a state of "
            "sharp, effortless clarity. 20 minutes."
        ),
        "category": "guided",
        "subcategory": "focus",
        "duration_seconds": 20 * 60,
        "instructor": "Marcus Webb",
        "audio_url": "https://cdn.stillpoint.app/audio/clarity-viz.mp3",
        "image_url": "https://cdn.stillpoint.app/images/clarity-viz.jpg",
        "is_daily_pick": False,
        "tags": ["advanced", "focus", "visualization"],
    },
    # ── Guided / Anxiety ─────────────────────────────────────────────────
    {
        "title": "Calm the Storm",
        "description": (
            "Gentle grounding techniques designed to interrupt the anxiety "
            "spiral and bring you back to the present moment."
        ),
        "category": "guided",
        "subcategory": "anxiety",
        "duration_seconds": 12 * 60,
        "instructor": "Priya Nair",
        "audio_url": "https://cdn.stillpoint.app/audio/calm-storm.mp3",
        "image_url": "https://cdn.stillpoint.app/images/calm-storm.jpg",
        "is_daily_pick": False,
        "tags": ["beginner", "stress-relief", "breathwork"],
    },
    # ── Guided / Morning ──────────────────────────────────────────────────
    {
        "title": "Sunrise Intention Setting",
        "description": (
            "Begin your day with purpose. This 10-minute morning practice "
            "combines breathwork and gentle affirmations."
        ),
        "category": "guided",
        "subcategory": "morning",
        "duration_seconds": 10 * 60,
        "instructor": "Priya Nair",
        "audio_url": "https://cdn.stillpoint.app/audio/sunrise-intention.mp3",
        "image_url": "https://cdn.stillpoint.app/images/sunrise-intention.jpg",
        "is_daily_pick": False,
        "tags": ["beginner", "morning"],
    },
    # ── Guided / Evening ──────────────────────────────────────────────────
    {
        "title": "Evening Wind-Down",
        "description": (
            "A slow, calming guided meditation that signals to your body it is "
            "safe to let the day go and rest deeply."
        ),
        "category": "guided",
        "subcategory": "evening",
        "duration_seconds": 15 * 60,
        "instructor": "Sarah Chen",
        "audio_url": "https://cdn.stillpoint.app/audio/evening-wind-down.mp3",
        "image_url": "https://cdn.stillpoint.app/images/evening-wind-down.jpg",
        "is_daily_pick": False,
        "tags": ["beginner", "evening", "stress-relief"],
    },
    # ── Sleep Story / Sleep ───────────────────────────────────────────────
    {
        "title": "The Forest Cabin",
        "description": (
            "Drift into sleep as you journey to a cozy cabin deep in a pine "
            "forest. Let the crackling fire and soft rain lull you to rest."
        ),
        "category": "sleep_story",
        "subcategory": "sleep",
        "duration_seconds": 30 * 60,
        "instructor": "James Holloway",
        "audio_url": "https://cdn.stillpoint.app/audio/forest-cabin.mp3",
        "image_url": "https://cdn.stillpoint.app/images/forest-cabin.jpg",
        "is_daily_pick": False,
        "tags": ["sleep", "nature", "beginner"],
    },
    {
        "title": "Stargazing on the Hillside",
        "description": (
            "Lie back under an endless night sky in this 25-minute sleep story "
            "that gently quiets racing thoughts."
        ),
        "category": "sleep_story",
        "subcategory": "sleep",
        "duration_seconds": 25 * 60,
        "instructor": "James Holloway",
        "audio_url": "https://cdn.stillpoint.app/audio/stargazing.mp3",
        "image_url": "https://cdn.stillpoint.app/images/stargazing.jpg",
        "is_daily_pick": False,
        "tags": ["sleep", "nature", "visualization"],
    },
    {
        "title": "The Quiet Library",
        "description": (
            "Wander through endless shelves of ancient books in a candlelit "
            "library where time moves gently and sleep finds you naturally."
        ),
        "category": "sleep_story",
        "subcategory": "sleep",
        "duration_seconds": 35 * 60,
        "instructor": "Amara Osei",
        "audio_url": "https://cdn.stillpoint.app/audio/quiet-library.mp3",
        "image_url": "https://cdn.stillpoint.app/images/quiet-library.jpg",
        "is_daily_pick": False,
        "tags": ["sleep", "intermediate"],
    },
    # ── Soundscape / Sleep ────────────────────────────────────────────────
    {
        "title": "Ocean Tide at Midnight",
        "description": (
            "60 minutes of uninterrupted ocean waves recorded at low tide. "
            "No narration — pure, immersive sound."
        ),
        "category": "soundscape",
        "subcategory": "sleep",
        "duration_seconds": 60 * 60,
        "instructor": None,
        "audio_url": "https://cdn.stillpoint.app/audio/ocean-midnight.mp3",
        "image_url": "https://cdn.stillpoint.app/images/ocean-midnight.jpg",
        "is_daily_pick": False,
        "tags": ["sleep", "nature", "beginner"],
    },
    # ── Soundscape / Focus ────────────────────────────────────────────────
    {
        "title": "Mountain Rain",
        "description": (
            "Steady mountain rainfall layered with distant thunder. Ideal for "
            "deep work or study sessions."
        ),
        "category": "soundscape",
        "subcategory": "focus",
        "duration_seconds": 45 * 60,
        "instructor": None,
        "audio_url": "https://cdn.stillpoint.app/audio/mountain-rain.mp3",
        "image_url": "https://cdn.stillpoint.app/images/mountain-rain.jpg",
        "is_daily_pick": False,
        "tags": ["focus", "nature", "beginner"],
    },
    # ── Soundscape / Morning ──────────────────────────────────────────────
    {
        "title": "Dawn Chorus",
        "description": (
            "Wake gently with a rich tapestry of birdsong recorded at sunrise "
            "in an old-growth forest."
        ),
        "category": "soundscape",
        "subcategory": "morning",
        "duration_seconds": 20 * 60,
        "instructor": None,
        "audio_url": "https://cdn.stillpoint.app/audio/dawn-chorus.mp3",
        "image_url": "https://cdn.stillpoint.app/images/dawn-chorus.jpg",
        "is_daily_pick": False,
        "tags": ["morning", "nature", "beginner"],
    },
]

# ---------------------------------------------------------------------------
# Badge definitions
# ---------------------------------------------------------------------------

BADGE_DATA: list[dict] = [
    {
        "name": "First Step",
        "description": "Complete your very first meditation session.",
        "icon": "🌱",
        "requirement_type": "total_sessions",
        "requirement_value": 1,
    },
    {
        "name": "Dedicated",
        "description": "Complete 50 meditation sessions.",
        "icon": "🔥",
        "requirement_type": "total_sessions",
        "requirement_value": 50,
    },
    {
        "name": "Century",
        "description": "Complete 100 meditation sessions.",
        "icon": "💯",
        "requirement_type": "total_sessions",
        "requirement_value": 100,
    },
    {
        "name": "Week Warrior",
        "description": "Maintain a 7-day meditation streak.",
        "icon": "⚡",
        "requirement_type": "streak",
        "requirement_value": 7,
    },
    {
        "name": "Marathon",
        "description": "Maintain a 30-day meditation streak.",
        "icon": "🏅",
        "requirement_type": "streak",
        "requirement_value": 30,
    },
    {
        "name": "Explorer",
        "description": "Meditate across 3 different session types.",
        "icon": "🧭",
        "requirement_type": "categories",
        "requirement_value": 3,
    },
]


# ---------------------------------------------------------------------------
# Seed runner
# ---------------------------------------------------------------------------


async def seed() -> None:
    """Drop and recreate all tables, then insert seed data."""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # ── Tags ──────────────────────────────────────────────────────────
        print("Seeding tags...")
        tag_map: dict[str, Tag] = {}
        for name in TAG_NAMES:
            tag = Tag(id=_id(), name=name)
            db.add(tag)
            tag_map[name] = tag
        await db.flush()

        # ── Sessions ──────────────────────────────────────────────────────
        print("Seeding sessions...")
        for data in SESSION_DATA:
            tag_names: list[str] = data.pop("tags", [])
            session = Session(id=_id(), **data)
            session.tags = [tag_map[t] for t in tag_names if t in tag_map]
            db.add(session)
        await db.flush()

        # ── Badges ────────────────────────────────────────────────────────
        print("Seeding badges...")
        for data in BADGE_DATA:
            badge = Badge(id=_id(), **data)
            db.add(badge)

        await db.commit()

    print(
        f"Seed complete. "
        f"{len(TAG_NAMES)} tags, "
        f"{len(SESSION_DATA)} sessions, "
        f"{len(BADGE_DATA)} badges inserted."
    )


if __name__ == "__main__":
    asyncio.run(seed())

"""Tests for storage layer."""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Redirect DB_PATH to a temp file for each test."""
    db_file = tmp_path / "test_stillwater.db"
    monkeypatch.setattr("stillwater_tui.storage.db.DB_PATH", db_file)
    monkeypatch.setattr("stillwater_tui.storage.db.DB_DIR", tmp_path)
    monkeypatch.setattr("stillwater_tui.storage.progress.DB_PATH", db_file)
    return db_file


@pytest.mark.asyncio
async def test_init_db_creates_tables(temp_db):
    from stillwater_tui.storage.db import init_db

    await init_db()
    assert temp_db.exists()


@pytest.mark.asyncio
async def test_init_db_seeds_sessions(temp_db):
    from stillwater_tui.storage.db import get_all_sessions, init_db

    await init_db()
    sessions = await get_all_sessions()
    assert len(sessions) == 13


@pytest.mark.asyncio
async def test_get_daily_pick(temp_db):
    from stillwater_tui.storage.db import get_daily_pick, init_db

    await init_db()
    pick = await get_daily_pick()
    assert pick is not None
    assert pick["is_daily_pick"] is True
    assert pick["title"] == "5-Minute Breath Reset"


@pytest.mark.asyncio
async def test_identity(temp_db):
    from stillwater_tui.storage.db import get_identity, init_db, set_identity

    await init_db()
    assert await get_identity() is None
    await set_identity("Alice")
    assert await get_identity() == "Alice"


@pytest.mark.asyncio
async def test_append_log_and_streak(temp_db):
    from stillwater_tui.storage.db import init_db
    from stillwater_tui.storage.progress import append_log, get_streak

    await init_db()
    await append_log(session_id=1, duration_seconds=300, completed=True)
    streak = await get_streak()
    assert streak["current_streak"] == 1
    assert streak["longest_streak"] == 1


@pytest.mark.asyncio
async def test_progress_summary(temp_db):
    from stillwater_tui.storage.db import init_db
    from stillwater_tui.storage.progress import append_log, get_progress_summary

    await init_db()
    await append_log(session_id=1, duration_seconds=300, completed=True)
    await append_log(session_id=3, duration_seconds=600, completed=True)
    summary = await get_progress_summary()
    assert summary["total_sessions"] == 2
    assert summary["total_minutes"] == 15


@pytest.mark.asyncio
async def test_first_step_badge(temp_db):
    from stillwater_tui.storage.db import init_db
    from stillwater_tui.storage.progress import append_log, get_badges

    await init_db()
    await append_log(session_id=1, duration_seconds=300, completed=True)
    badges = await get_badges()
    first_step = next(b for b in badges if b["id"] == "first_step")
    assert first_step["earned"] is True


@pytest.mark.asyncio
async def test_heatmap(temp_db):
    from stillwater_tui.storage.db import init_db
    from stillwater_tui.storage.progress import append_log, get_heatmap

    await init_db()
    await append_log(session_id=1, duration_seconds=300, completed=True)
    heatmap = await get_heatmap()
    from datetime import date

    today = date.today().isoformat()
    assert today in heatmap
    assert heatmap[today] >= 1


@pytest.mark.asyncio
async def test_categories_badge(temp_db):
    from stillwater_tui.storage.db import init_db
    from stillwater_tui.storage.progress import append_log, get_badges

    await init_db()
    # Log sessions from 3 different categories
    await append_log(session_id=1, duration_seconds=300, completed=True)   # guided
    await append_log(session_id=8, duration_seconds=1800, completed=True)  # sleep_story
    await append_log(session_id=11, duration_seconds=600, completed=True)  # soundscape
    badges = await get_badges()
    explorer = next(b for b in badges if b["id"] == "explorer")
    assert explorer["earned"] is True


@pytest.mark.asyncio
async def test_incomplete_log_not_counted(temp_db):
    from stillwater_tui.storage.db import init_db
    from stillwater_tui.storage.progress import append_log, get_progress_summary

    await init_db()
    await append_log(session_id=1, duration_seconds=60, completed=False)
    summary = await get_progress_summary()
    assert summary["total_sessions"] == 0

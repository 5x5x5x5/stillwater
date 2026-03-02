"""Basic app smoke tests using Textual's testing pilot."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest


@pytest.mark.asyncio
async def test_app_mounts(tmp_path, monkeypatch):
    """App should mount without errors (DB redirected to temp)."""
    db_file = tmp_path / "test.db"
    monkeypatch.setattr("stillwater_tui.storage.db.DB_PATH", db_file)
    monkeypatch.setattr("stillwater_tui.storage.db.DB_DIR", tmp_path)
    monkeypatch.setattr("stillwater_tui.storage.progress.DB_PATH", db_file)

    with patch("stillwater_tui.audio.engine._PYGAME_AVAILABLE", False), patch(
        "stillwater_tui.audio.ambient._PYGAME_AVAILABLE", False
    ):
        from stillwater_tui.app import StillwaterApp

        app = StillwaterApp()
        # Patch get_identity to return a name (skip name prompt)
        with patch(
            "stillwater_tui.app.get_identity", new_callable=AsyncMock, return_value="Test"
        ), patch(
            "stillwater_tui.screens.home.get_identity",
            new_callable=AsyncMock,
            return_value="Test",
        ), patch(
            "stillwater_tui.screens.home.get_daily_pick",
            new_callable=AsyncMock,
            return_value=None,
        ):
            async with app.run_test(headless=True) as pilot:
                # App should be running
                assert app.is_running
                await pilot.press("q")

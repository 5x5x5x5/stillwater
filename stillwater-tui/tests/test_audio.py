"""Tests for audio engine (without real pygame)."""

from __future__ import annotations

from unittest.mock import patch

import pytest


@pytest.fixture
def engine_no_pygame():
    """Create AudioEngine with pygame disabled."""
    with patch("stillwater_tui.audio.engine._PYGAME_AVAILABLE", False):
        from stillwater_tui.audio.engine import AudioEngine

        eng = AudioEngine()
        yield eng
        eng.shutdown()


def test_engine_initializes(engine_no_pygame):
    assert engine_no_pygame._available is False
    assert engine_no_pygame.is_playing is False


def test_engine_play_sets_session(engine_no_pygame):
    session = {"id": 1, "title": "Test", "duration_seconds": 60, "audio_url": ""}
    engine_no_pygame.play(session)
    assert engine_no_pygame.current_session is not None
    assert engine_no_pygame.current_session["title"] == "Test"
    engine_no_pygame.stop()


def test_engine_pause_resume(engine_no_pygame):
    session = {"id": 1, "title": "Test", "duration_seconds": 60, "audio_url": ""}
    engine_no_pygame.play(session)
    assert engine_no_pygame.is_playing is True

    engine_no_pygame.pause()
    assert engine_no_pygame.is_paused is True
    assert engine_no_pygame.is_playing is False

    engine_no_pygame.resume()
    assert engine_no_pygame.is_playing is True
    engine_no_pygame.stop()


def test_engine_stop_clears_session(engine_no_pygame):
    session = {"id": 1, "title": "Test", "duration_seconds": 60, "audio_url": ""}
    engine_no_pygame.play(session)
    engine_no_pygame.stop()
    assert engine_no_pygame.current_session is None
    assert engine_no_pygame.is_playing is False


def test_engine_volume_clamped(engine_no_pygame):
    engine_no_pygame.set_volume(2.0)
    assert engine_no_pygame._volume == 1.0
    engine_no_pygame.set_volume(-0.5)
    assert engine_no_pygame._volume == 0.0


def test_progress_callback_called(engine_no_pygame):
    import time

    received = []

    def cb(elapsed, total):
        received.append((elapsed, total))

    engine_no_pygame.set_progress_callback(cb)
    session = {"id": 1, "title": "Test", "duration_seconds": 5, "audio_url": ""}
    engine_no_pygame.play(session)
    time.sleep(1.5)  # Wait for at least one tick
    engine_no_pygame.stop()
    assert len(received) > 0
    assert received[0][1] == 5  # total should be 5

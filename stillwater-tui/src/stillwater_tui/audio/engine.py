"""Audio engine for session playback using pygame.mixer."""

from __future__ import annotations

import threading
import time
from collections.abc import Callable
from typing import TYPE_CHECKING

try:
    import pygame

    _PYGAME_AVAILABLE = True
except ImportError:
    _PYGAME_AVAILABLE = False

if TYPE_CHECKING:
    pass


class AudioEngine:
    """Session audio playback via pygame.mixer.music."""

    def __init__(self) -> None:
        self._available = _PYGAME_AVAILABLE
        self._session: dict | None = None
        self._duration: int = 0
        self._paused = False
        self._stopped = True
        self._volume: float = 0.8
        self._progress_callback: Callable[[int, int], None] | None = None
        self._end_callback: Callable[[], None] | None = None
        self._poll_thread: threading.Thread | None = None
        self._poll_stop = threading.Event()

        if self._available:
            try:
                pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
                pygame.init()
            except Exception:
                self._available = False

    def set_progress_callback(self, cb: Callable[[int, int], None]) -> None:
        """cb(elapsed_seconds, total_seconds)"""
        self._progress_callback = cb

    def set_end_callback(self, cb: Callable[[], None]) -> None:
        self._end_callback = cb

    def play(self, session: dict) -> None:
        self._session = session
        self._duration = session.get("duration_seconds", 0)
        self._paused = False
        self._stopped = False

        if self._available:
            audio_url = session.get("audio_url", "")
            try:
                pygame.mixer.music.load(audio_url)
                pygame.mixer.music.set_volume(self._volume)
                pygame.mixer.music.play()
            except Exception:
                # Audio file not available — still track progress virtually
                pass

        self._start_poll_thread()

    def pause(self) -> None:
        self._paused = True
        if self._available:
            try:
                pygame.mixer.music.pause()
            except Exception:
                pass

    def resume(self) -> None:
        self._paused = False
        if self._available:
            try:
                pygame.mixer.music.unpause()
            except Exception:
                pass

    def stop(self) -> None:
        self._stopped = True
        self._poll_stop.set()
        if self._available:
            try:
                pygame.mixer.music.stop()
            except Exception:
                pass
        self._session = None

    def set_volume(self, vol: float) -> None:
        self._volume = max(0.0, min(1.0, vol))
        if self._available:
            try:
                pygame.mixer.music.set_volume(self._volume)
            except Exception:
                pass

    @property
    def is_playing(self) -> bool:
        return not self._stopped and not self._paused

    @property
    def is_paused(self) -> bool:
        return self._paused

    @property
    def current_session(self) -> dict | None:
        return self._session

    def _start_poll_thread(self) -> None:
        if self._poll_thread and self._poll_thread.is_alive():
            self._poll_stop.set()
            self._poll_thread.join(timeout=1)
        self._poll_stop = threading.Event()
        self._poll_thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._poll_thread.start()

    def _poll_loop(self) -> None:
        start_time = time.monotonic()
        last_elapsed = 0
        while not self._poll_stop.is_set():
            if self._stopped:
                break
            if not self._paused:
                elapsed = int(time.monotonic() - start_time)
                if elapsed != last_elapsed:
                    last_elapsed = elapsed
                    if self._progress_callback:
                        self._progress_callback(elapsed, self._duration)
                # Check for natural end
                if self._available:
                    try:
                        if not pygame.mixer.music.get_busy() and not self._paused:
                            # Might have ended
                            if elapsed >= self._duration - 2 and self._duration > 0:
                                self._stopped = True
                                if self._end_callback:
                                    self._end_callback()
                                break
                    except Exception:
                        pass
                elif self._duration > 0 and elapsed >= self._duration:
                    self._stopped = True
                    if self._end_callback:
                        self._end_callback()
                    break
            time.sleep(0.1)

    def shutdown(self) -> None:
        self.stop()
        if self._available:
            try:
                pygame.mixer.quit()
            except Exception:
                pass

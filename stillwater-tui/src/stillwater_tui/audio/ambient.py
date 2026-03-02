"""Ambient sound mixer with 6 independent channels."""

from __future__ import annotations

import asyncio
from pathlib import Path

try:
    import pygame

    _PYGAME_AVAILABLE = True
except ImportError:
    _PYGAME_AVAILABLE = False

AMBIENT_DIR = Path.home() / ".local" / "share" / "stillwater" / "audio" / "ambient"

AMBIENT_SOUNDS = [
    {"id": "rain", "label": "Rain", "file": "rain.mp3"},
    {"id": "forest", "label": "Forest", "file": "forest.mp3"},
    {"id": "ocean", "label": "Ocean", "file": "ocean.mp3"},
    {"id": "fire", "label": "Fire", "file": "fire.mp3"},
    {"id": "wind", "label": "Wind", "file": "wind.mp3"},
    {"id": "cafe", "label": "Café", "file": "cafe.mp3"},
]

BELL_SOUNDS = {
    "singing_bowl": "bell_bowl.mp3",
    "chime": "bell_chime.mp3",
    "gong": "bell_gong.mp3",
}

BELL_INTERVALS = [0, 5, 10, 15, 30]  # 0 = off


class AmbientMixer:
    """Manages 6 ambient sound channels and bell intervals."""

    def __init__(self) -> None:
        self._available = _PYGAME_AVAILABLE
        self._channels: dict[str, object] = {}  # sound_id → pygame.Channel
        self._sounds: dict[str, object] = {}  # sound_id → pygame.Sound
        self._volumes: dict[str, float] = {s["id"]: 0.0 for s in AMBIENT_SOUNDS}
        self._bell_task: asyncio.Task | None = None
        self._bell_interval: int = 0  # minutes
        self._bell_sound: object | None = None

        if self._available:
            # Reserve channels 0-5 for ambient sounds
            pygame.mixer.set_num_channels(max(8, pygame.mixer.get_num_channels()))

    def _load_sound(self, sound_id: str, filename: str) -> bool:
        if not self._available:
            return False
        path = AMBIENT_DIR / filename
        if not path.exists():
            return False
        try:
            sound = pygame.mixer.Sound(str(path))
            channel_idx = next(
                i for i, s in enumerate(AMBIENT_SOUNDS) if s["id"] == sound_id
            )
            channel = pygame.mixer.Channel(channel_idx)
            self._sounds[sound_id] = sound
            self._channels[sound_id] = channel
            return True
        except Exception:
            return False

    def toggle(self, sound_id: str) -> float:
        """Toggle ambient sound on/off. Returns new volume (0.0 or 0.5)."""
        current = self._volumes.get(sound_id, 0.0)
        new_vol = 0.5 if current == 0.0 else 0.0
        self.set_volume(sound_id, new_vol)
        return new_vol

    def set_volume(self, sound_id: str, vol: float) -> None:
        vol = max(0.0, min(1.0, vol))
        self._volumes[sound_id] = vol

        if not self._available:
            return

        # Load on demand
        if sound_id not in self._sounds:
            info = next((s for s in AMBIENT_SOUNDS if s["id"] == sound_id), None)
            if info:
                self._load_sound(sound_id, info["file"])

        sound = self._sounds.get(sound_id)
        channel = self._channels.get(sound_id)
        if sound is None or channel is None:
            return

        try:
            if vol > 0:
                channel.set_volume(vol)
                if not channel.get_busy():
                    channel.play(sound, loops=-1)
            else:
                channel.stop()
        except Exception:
            pass

    def get_volume(self, sound_id: str) -> float:
        return self._volumes.get(sound_id, 0.0)

    def stop_all(self) -> None:
        if not self._available:
            return
        for channel in self._channels.values():
            try:
                channel.stop()
            except Exception:
                pass
        self._volumes = {s["id"]: 0.0 for s in AMBIENT_SOUNDS}

    # ------------------------------------------------------------------
    # Bell intervals
    # ------------------------------------------------------------------

    def set_bell_interval(self, minutes: int) -> None:
        self._bell_interval = minutes
        if self._bell_task:
            self._bell_task.cancel()
            self._bell_task = None
        if minutes > 0:
            self._bell_task = asyncio.create_task(self._bell_loop(minutes))

    async def _bell_loop(self, minutes: int) -> None:
        try:
            while True:
                await asyncio.sleep(minutes * 60)
                self._ring_bell()
        except asyncio.CancelledError:
            pass

    def _ring_bell(self) -> None:
        if not self._available or self._bell_sound is None:
            return
        try:
            self._bell_sound.play()
        except Exception:
            pass

    def load_bell(self, bell_type: str = "singing_bowl") -> None:
        if not self._available:
            return
        filename = BELL_SOUNDS.get(bell_type, BELL_SOUNDS["singing_bowl"])
        path = AMBIENT_DIR / filename
        if not path.exists():
            return
        try:
            self._bell_sound = pygame.mixer.Sound(str(path))
        except Exception:
            pass

    def shutdown(self) -> None:
        if self._bell_task:
            self._bell_task.cancel()
        self.stop_all()

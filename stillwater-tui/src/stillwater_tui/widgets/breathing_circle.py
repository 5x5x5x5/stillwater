"""BreathingCircle widget — animated breathing guide."""

from __future__ import annotations

from rich.text import Text
from textual.message import Message
from textual.reactive import reactive
from textual.widget import Widget

# Breathing patterns: list of (phase_name, duration_seconds)
PATTERNS: dict[str, list[tuple[str, float]]] = {
    "box": [
        ("Inhale", 4),
        ("Hold", 4),
        ("Exhale", 4),
        ("Hold", 4),
    ],
    "478": [
        ("Inhale", 4),
        ("Hold", 7),
        ("Exhale", 8),
    ],
    "coherent": [
        ("Inhale", 5),
        ("Exhale", 5),
    ],
}

PHASE_COLORS = {
    "Inhale": "#c4b5e0",   # lavender
    "Exhale": "#a8c5a0",   # sage
    "Hold": "#f5e6cc",     # sand
}

# Circle characters at different radii
CIRCLE_CHARS = ["○", "◎", "●", "⬤"]


class BreathingCircle(Widget):
    """Animated breathing guide circle that pulses through phases."""

    DEFAULT_CSS = """
    BreathingCircle {
        width: 100%;
        height: 15;
        content-align: center middle;
        text-align: center;
    }
    """

    phase_name: reactive[str] = reactive("Ready")
    phase_progress: reactive[float] = reactive(0.0)
    is_active: reactive[bool] = reactive(False)

    def __init__(
        self,
        pattern: str = "box",
        duration_minutes: int = 5,
        **kwargs,
    ) -> None:
        super().__init__(**kwargs)
        self._pattern = pattern
        self._duration_minutes = duration_minutes
        self._elapsed: float = 0.0
        self._total_duration = duration_minutes * 60.0
        self._tick_timer = None

    def start(self) -> None:
        self._elapsed = 0.0
        self.is_active = True
        self._tick_timer = self.set_interval(1 / 30, self._tick)

    def stop(self) -> None:
        self.is_active = False
        if self._tick_timer:
            self._tick_timer.stop()
            self._tick_timer = None
        self.phase_name = "Done"
        self.phase_progress = 0.0

    def pause(self) -> None:
        self.is_active = False
        if self._tick_timer:
            self._tick_timer.stop()
            self._tick_timer = None

    def resume(self) -> None:
        self.is_active = True
        self._tick_timer = self.set_interval(1 / 30, self._tick)

    def set_pattern(self, pattern: str) -> None:
        self._pattern = pattern
        self._elapsed = 0.0
        self.phase_name = "Ready"
        self.phase_progress = 0.0

    def set_duration(self, minutes: int) -> None:
        self._duration_minutes = minutes
        self._total_duration = minutes * 60.0

    def _tick(self) -> None:
        if not self.is_active:
            return

        self._elapsed += 1 / 30

        if self._elapsed >= self._total_duration:
            self.stop()
            self.post_message(BreathingCircle.Completed(self._duration_minutes))
            return

        phases = PATTERNS.get(self._pattern, PATTERNS["box"])
        cycle_duration = sum(d for _, d in phases)
        cycle_pos = self._elapsed % cycle_duration

        accumulated = 0.0
        for name, duration in phases:
            if cycle_pos < accumulated + duration:
                self.phase_name = name
                self.phase_progress = (cycle_pos - accumulated) / duration
                break
            accumulated += duration

    def render(self) -> Text:
        text = Text(justify="center")

        if not self.is_active and self.phase_name not in ("Done",):
            # Idle state
            text.append("\n\n")
            text.append("  ○  \n", style="#c4b5e0")
            text.append("\n")
            text.append("  Press Start  ", style="#c4b5e0")
            return text

        color = PHASE_COLORS.get(self.phase_name, "#c4b5e0")
        progress = self.phase_progress

        # Scale: 1.0 (exhale/end) → 1.6 (inhale/end)
        if self.phase_name == "Inhale":
            scale = 1.0 + 0.6 * progress
        elif self.phase_name == "Exhale":
            scale = 1.6 - 0.6 * progress
        else:
            scale = 1.3  # Hold

        # Build a simple ASCII circle scaled by `scale`
        # Use concentric rings based on scale
        rings = max(1, round(scale * 3))
        ring_chars = ["·", "○", "◎", "●", "⬤"]

        text.append("\n")
        for i in range(rings, 0, -1):
            ch = ring_chars[min(i - 1, len(ring_chars) - 1)]
            spaces = "   " * (rings - i)
            text.append(spaces + ch * (i * 2 - 1) + spaces + "\n", style=color)

        # Phase label
        text.append(f"\n  {self.phase_name}  ", style=color)

        # Progress indicator
        bar_width = 20
        filled = round(bar_width * progress)
        bar = "█" * filled + "░" * (bar_width - filled)
        text.append(f"\n  [{bar}]  ", style="#444466")

        return text

    class Completed(Message):
        def __init__(self, duration_minutes: int) -> None:
            super().__init__()
            self.duration_minutes = duration_minutes

"""BreathingScreen — pattern selector and animated breathing exercise."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Button, Label, Select, Static

from ..storage.progress import append_log
from ..widgets.breathing_circle import BreathingCircle

PATTERNS = [
    ("box", "Box Breathing (4-4-4-4)"),
    ("478", "4-7-8 Breathing"),
    ("coherent", "Coherent Breathing (5-5)"),
]

DURATIONS = [
    (3, "3 minutes"),
    (5, "5 minutes"),
    (10, "10 minutes"),
    (15, "15 minutes"),
]


class BreathingScreen(Screen):
    """Breathing exercise screen with pattern picker and animated circle."""

    BINDINGS = [("escape", "app.switch_screen('home')", "Home")]

    DEFAULT_CSS = """
    BreathingScreen {
        align: center top;
        padding: 2;
    }
    #breathing-container {
        width: 70;
        height: auto;
        align: center top;
    }
    #breathing-title {
        text-style: bold;
        color: $accent;
        text-align: center;
        width: 100%;
        margin-bottom: 2;
    }
    #pattern-row {
        layout: horizontal;
        height: 3;
        margin-bottom: 1;
        align: center middle;
        width: 100%;
    }
    #pattern-row Label {
        width: 18;
        color: $text-muted;
        margin-right: 1;
        align: left middle;
        height: 3;
    }
    #pattern-select {
        width: 35;
    }
    #duration-row {
        layout: horizontal;
        height: 3;
        margin-bottom: 2;
        align: center middle;
        width: 100%;
    }
    #duration-row Label {
        width: 18;
        color: $text-muted;
        margin-right: 1;
        align: left middle;
        height: 3;
    }
    #duration-select {
        width: 35;
    }
    #circle-area {
        width: 100%;
        height: 15;
        align: center middle;
    }
    #breath-controls {
        layout: horizontal;
        height: 3;
        margin-top: 2;
        align: center middle;
        width: 100%;
    }
    #breath-controls Button {
        margin: 0 1;
        min-width: 12;
    }
    #breath-status {
        text-align: center;
        width: 100%;
        color: $text-muted;
        margin-top: 1;
    }
    """

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._pattern = "box"
        self._duration = 5
        self._running = False

    def compose(self) -> ComposeResult:
        with Static(id="breathing-container"):
            yield Label("🌬  Breathing Exercise", id="breathing-title")

            with Static(id="pattern-row"):
                yield Label("Pattern:")
                yield Select(
                    [(label, value) for value, label in PATTERNS],
                    value="box",
                    id="pattern-select",
                )

            with Static(id="duration-row"):
                yield Label("Duration:")
                yield Select(
                    [(label, str(value)) for value, label in DURATIONS],
                    value="5",
                    id="duration-select",
                )

            with Static(id="circle-area"):
                yield BreathingCircle(
                    pattern=self._pattern,
                    duration_minutes=self._duration,
                    id="breathing-circle",
                )

            with Static(id="breath-controls"):
                yield Button("▶  Start", id="btn-start", variant="primary")
                yield Button("⏸  Pause", id="btn-pause", variant="default", disabled=True)
                yield Button("⏹  End", id="btn-end", variant="default", disabled=True)

            yield Label("Select a pattern and press Start", id="breath-status")

    def on_select_changed(self, event: Select.Changed) -> None:
        if event.select.id == "pattern-select":
            self._pattern = str(event.value)
            circle = self.query_one("#breathing-circle", BreathingCircle)
            circle.set_pattern(self._pattern)
        elif event.select.id == "duration-select":
            self._duration = int(event.value)
            circle = self.query_one("#breathing-circle", BreathingCircle)
            circle.set_duration(self._duration)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-start":
            self._start_exercise()
        elif event.button.id == "btn-pause":
            self._pause_resume()
        elif event.button.id == "btn-end":
            self._end_exercise()

    def _start_exercise(self) -> None:
        self._running = True
        circle = self.query_one("#breathing-circle", BreathingCircle)
        circle.set_pattern(self._pattern)
        circle.set_duration(self._duration)
        circle.start()

        self.query_one("#btn-start", Button).disabled = True
        self.query_one("#btn-pause", Button).disabled = False
        self.query_one("#btn-end", Button).disabled = False
        self.query_one("#breath-status", Label).update(
            f"Breathing: {dict(PATTERNS)[self._pattern]}"
        )

    def _pause_resume(self) -> None:
        circle = self.query_one("#breathing-circle", BreathingCircle)
        btn = self.query_one("#btn-pause", Button)
        if circle.is_active:
            circle.pause()
            btn.label = "▶  Resume"
            self.query_one("#breath-status", Label).update("Paused")
        else:
            circle.resume()
            btn.label = "⏸  Pause"
            self.query_one("#breath-status", Label).update(
                f"Breathing: {dict(PATTERNS)[self._pattern]}"
            )

    def _end_exercise(self) -> None:
        circle = self.query_one("#breathing-circle", BreathingCircle)
        circle.stop()
        self._running = False
        self._reset_controls()

    def _reset_controls(self) -> None:
        self.query_one("#btn-start", Button).disabled = False
        self.query_one("#btn-pause", Button).disabled = True
        self.query_one("#btn-end", Button).disabled = True
        self.query_one("#btn-pause", Button).label = "⏸  Pause"
        self.query_one("#breath-status", Label).update("Select a pattern and press Start")

    async def on_breathing_circle_completed(self, event: BreathingCircle.Completed) -> None:
        """Log the breathing session on natural completion."""
        self._running = False
        duration_seconds = event.duration_minutes * 60
        await append_log(
            session_id=None,
            duration_seconds=duration_seconds,
            completed=True,
            session_type="breathing",
        )
        self._reset_controls()
        self.query_one("#breath-status", Label).update(
            f"Well done! {event.duration_minutes} min breathing session logged."
        )

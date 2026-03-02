"""PlayerBar — persistent bottom bar showing playback state."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.message import Message
from textual.reactive import reactive
from textual.widget import Widget
from textual.widgets import Button, Label, Static


def _fmt_time(seconds: int) -> str:
    m, s = divmod(max(0, seconds), 60)
    return f"{m:02d}:{s:02d}"


class PlayerBar(Widget):
    """Displays current session info and playback controls."""

    DEFAULT_CSS = """
    PlayerBar {
        dock: bottom;
        height: 5;
        background: $panel;
        border-top: solid $accent 30%;
        padding: 0 2;
        layout: horizontal;
        align: left middle;
    }
    PlayerBar #pb-info {
        width: 1fr;
    }
    PlayerBar #pb-title {
        text-style: bold;
        color: $text;
    }
    PlayerBar #pb-time {
        color: $text-muted;
    }
    PlayerBar #pb-controls {
        width: auto;
        layout: horizontal;
        align: center middle;
        height: 100%;
    }
    PlayerBar Button {
        min-width: 5;
        height: 3;
        margin: 0 1;
    }
    PlayerBar #pb-volume {
        width: 20;
        layout: horizontal;
        align: center middle;
        height: 100%;
    }
    PlayerBar #vol-label {
        color: $text-muted;
        width: 8;
    }
    """

    title: reactive[str] = reactive("No session playing")
    elapsed: reactive[int] = reactive(0)
    duration: reactive[int] = reactive(0)
    playing: reactive[bool] = reactive(False)
    volume: reactive[float] = reactive(0.8)

    def compose(self) -> ComposeResult:
        with Static(id="pb-info"):
            yield Label("No session playing", id="pb-title")
            yield Label("--:-- / --:--", id="pb-time")
        with Static(id="pb-controls"):
            yield Button("⏮", id="btn-prev", variant="default")
            yield Button("▶", id="btn-playpause", variant="primary")
            yield Button("⏹", id="btn-stop", variant="default")
        with Static(id="pb-volume"):
            yield Label("Vol: 80%", id="vol-label")

    def watch_title(self, value: str) -> None:
        try:
            self.query_one("#pb-title", Label).update(value)
        except Exception:
            pass

    def watch_elapsed(self, value: int) -> None:
        self._update_time()

    def watch_duration(self, value: int) -> None:
        self._update_time()

    def watch_playing(self, value: bool) -> None:
        try:
            btn = self.query_one("#btn-playpause", Button)
            btn.label = "⏸" if value else "▶"
        except Exception:
            pass

    def watch_volume(self, value: float) -> None:
        try:
            self.query_one("#vol-label", Label).update(f"Vol: {int(value * 100)}%")
        except Exception:
            pass

    def _update_time(self) -> None:
        try:
            self.query_one("#pb-time", Label).update(
                f"{_fmt_time(self.elapsed)} / {_fmt_time(self.duration)}"
            )
        except Exception:
            pass

    def update_progress(self, elapsed: int, total: int) -> None:
        self.elapsed = elapsed
        self.duration = total

    def set_session(self, session: dict) -> None:
        self.title = session.get("title", "Unknown")
        self.duration = session.get("duration_seconds", 0)
        self.elapsed = 0
        self.playing = True

    def clear_session(self) -> None:
        self.title = "No session playing"
        self.elapsed = 0
        self.duration = 0
        self.playing = False

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-playpause":
            self.post_message(PlayerBar.PlayPause())
        elif event.button.id == "btn-stop":
            self.post_message(PlayerBar.Stop())

    class PlayPause(Message):
        pass

    class Stop(Message):
        pass

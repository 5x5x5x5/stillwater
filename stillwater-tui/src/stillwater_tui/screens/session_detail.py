"""SessionDetailScreen — modal with full session info and play button."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.screen import ModalScreen
from textual.widgets import Button, Label, Static


def _fmt_duration(seconds: int) -> str:
    mins = seconds // 60
    secs = seconds % 60
    if secs:
        return f"{mins}m {secs}s"
    return f"{mins} min"


CATEGORY_ICONS = {
    "guided": "🧘",
    "sleep_story": "🌙",
    "soundscape": "🎵",
}


class SessionDetailScreen(ModalScreen):
    """Modal screen showing full session details."""

    DEFAULT_CSS = """
    SessionDetailScreen {
        align: center middle;
    }
    #detail-box {
        width: 60;
        height: auto;
        max-height: 30;
        background: $panel;
        border: solid $accent;
        padding: 2 3;
    }
    #detail-title {
        text-style: bold;
        color: $accent;

        margin-bottom: 1;
    }
    #detail-meta {
        color: $text-muted;
        margin-bottom: 1;
    }
    #detail-desc {
        margin-bottom: 2;
    }
    #detail-tags {
        color: $text-muted;
        margin-bottom: 2;
    }
    #detail-buttons {
        layout: horizontal;
        height: auto;
    }
    #detail-buttons Button {
        margin-right: 1;
    }
    """

    BINDINGS = [("escape", "dismiss", "Close")]

    def __init__(self, session: dict, **kwargs) -> None:
        super().__init__(**kwargs)
        self._session = session

    def compose(self) -> ComposeResult:
        s = self._session
        icon = CATEGORY_ICONS.get(s.get("category", "guided"), "🧘")
        category = s.get("category", "guided").replace("_", " ").title()
        instructor = s.get("instructor") or "—"
        tags = ", ".join(s.get("tags", []))

        with Static(id="detail-box"):
            yield Label(f"{icon}  {s.get('title', 'Session')}", id="detail-title")
            yield Label(
                f"{_fmt_duration(s.get('duration_seconds', 0))}  ·  {category}  ·  {instructor}",
                id="detail-meta",
            )
            yield Label(s.get("description", ""), id="detail-desc")
            if tags:
                yield Label(f"Tags: {tags}", id="detail-tags")
            with Static(id="detail-buttons"):
                yield Button("▶  Play", id="btn-play", variant="primary")
                yield Button("✕  Close", id="btn-close", variant="default")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-play":
            self.app.start_session(self._session)
            self.dismiss()
        elif event.button.id == "btn-close":
            self.dismiss()

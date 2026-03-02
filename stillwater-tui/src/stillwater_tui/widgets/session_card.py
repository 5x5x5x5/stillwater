"""SessionCard widget — displays a session's title, duration, and category."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.widgets import Label, Static


def _fmt_duration(seconds: int) -> str:
    mins = seconds // 60
    return f"{mins} min"


CATEGORY_ICONS = {
    "guided": "🧘",
    "sleep_story": "🌙",
    "soundscape": "🎵",
}


class SessionCard(Static):
    """A pressable card displaying session info."""

    DEFAULT_CSS = """
    SessionCard {
        border: solid $accent 30%;
        padding: 1 2;
        margin: 0 0 1 0;
        height: auto;
    }
    SessionCard:hover {
        border: solid $accent;
        background: $accent 10%;
    }
    SessionCard:focus {
        border: solid $accent;
        background: $accent 15%;
    }
    SessionCard .sc-title {
        text-style: bold;
        color: $text;
    }
    SessionCard .sc-meta {
        color: $text-muted;
    }
    """

    ALLOW_FOCUS = True

    def __init__(self, session: dict, **kwargs) -> None:
        super().__init__(**kwargs)
        self._session = session

    @property
    def session(self) -> dict:
        return self._session

    def compose(self) -> ComposeResult:
        icon = CATEGORY_ICONS.get(self._session.get("category", "guided"), "🧘")
        title = self._session.get("title", "Unknown")
        duration = _fmt_duration(self._session.get("duration_seconds", 0))
        instructor = self._session.get("instructor") or "—"
        category = self._session.get("category", "guided").replace("_", " ").title()

        yield Label(f"{icon}  {title}", classes="sc-title")
        yield Label(f"{duration}  ·  {category}  ·  {instructor}", classes="sc-meta")

    def on_click(self) -> None:
        self.post_message(SessionCard.Selected(self._session))

    def on_key(self, event) -> None:
        if event.key in ("enter", "space"):
            self.post_message(SessionCard.Selected(self._session))

    class Selected(Static.Message if hasattr(Static, "Message") else object):
        """Posted when the card is selected."""

        def __init__(self, session: dict) -> None:
            super().__init__()
            self.session = session

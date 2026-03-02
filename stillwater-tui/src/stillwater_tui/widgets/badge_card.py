"""BadgeCard widget — displays a badge with earned/locked state."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.widgets import Label, Static


class BadgeCard(Static):
    """Shows a single badge, visually distinct when earned vs locked."""

    DEFAULT_CSS = """
    BadgeCard {
        border: solid $accent 20%;
        padding: 1 2;
        margin: 0 1 1 0;
        width: 22;
        height: 6;
    }
    BadgeCard.earned {
        border: solid $accent;
        background: $accent 10%;
    }
    BadgeCard.locked {
        border: solid $panel;
        color: $text-muted;
    }
    BadgeCard .bc-icon {
        text-align: center;
        width: 100%;
    }
    BadgeCard .bc-name {
        text-style: bold;
        text-align: center;
        width: 100%;
    }
    BadgeCard .bc-desc {
        text-align: center;
        width: 100%;
        color: $text-muted;
        text-style: italic;
    }
    """

    def __init__(self, badge: dict, **kwargs) -> None:
        super().__init__(**kwargs)
        self._badge = badge
        if badge.get("earned"):
            self.add_class("earned")
        else:
            self.add_class("locked")

    def compose(self) -> ComposeResult:
        icon = self._badge.get("icon", "🏅")
        name = self._badge.get("name", "Badge")
        desc = self._badge.get("description", "")

        if self._badge.get("earned"):
            yield Label(icon, classes="bc-icon")
            yield Label(name, classes="bc-name")
        else:
            yield Label("🔒", classes="bc-icon")
            yield Label(name, classes="bc-name")
            yield Label(desc, classes="bc-desc")

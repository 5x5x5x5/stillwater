"""HomeScreen — greeting, daily pick, quick-start buttons."""

from __future__ import annotations

from datetime import datetime

from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Button, Label, Static

from ..storage.db import get_daily_pick, get_identity
from ..widgets.session_card import SessionCard


def _greeting() -> str:
    hour = datetime.now().hour
    if hour < 12:
        return "Good morning"
    if hour < 17:
        return "Good afternoon"
    return "Good evening"


class HomeScreen(Screen):
    """Home screen with greeting, daily pick, and nav buttons."""

    BINDINGS = [("escape", "app.pop_screen", "Back")]

    DEFAULT_CSS = """
    HomeScreen {
        align: center middle;
    }
    #home-container {
        width: 60;
        height: auto;
        align: center top;
        padding: 2 0;
    }
    #greeting {
        text-style: bold;
        color: $accent;
        text-align: center;
        width: 100%;
        margin-bottom: 2;

    }
    #daily-label {
        color: $text-muted;
        margin-bottom: 1;
    }
    #home-buttons {
        margin-top: 2;
        width: 100%;
        height: auto;
    }
    #home-buttons Button {
        width: 100%;
        margin-bottom: 1;
    }
    """

    def compose(self) -> ComposeResult:
        with Static(id="home-container"):
            yield Label("...", id="greeting")
            yield Label("Today's Pick", id="daily-label")
            yield Static(id="daily-pick-slot")
            with Static(id="home-buttons"):
                yield Button("🧘  Browse Library", id="btn-library", variant="default")
                yield Button("🌬  Breathing Exercise", id="btn-breathing", variant="default")
                yield Button("📊  My Progress", id="btn-progress", variant="default")

    async def on_mount(self) -> None:
        name = await get_identity() or "there"
        greeting = f"{_greeting()}, {name}"
        self.query_one("#greeting", Label).update(greeting)

        daily = await get_daily_pick()
        slot = self.query_one("#daily-pick-slot", Static)
        if daily:
            card = SessionCard(daily)
            await slot.mount(card)
        else:
            await slot.mount(Label("No daily pick available", classes="text-muted"))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-library":
            self.app.switch_screen("library")
        elif event.button.id == "btn-breathing":
            self.app.switch_screen("breathing")
        elif event.button.id == "btn-progress":
            self.app.switch_screen("progress")

    def on_session_card_selected(self, event: SessionCard.Selected) -> None:
        from .session_detail import SessionDetailScreen

        self.app.push_screen(SessionDetailScreen(event.session))

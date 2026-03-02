"""LibraryScreen — session list with category filter."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import VerticalScroll
from textual.reactive import reactive
from textual.screen import Screen
from textual.widgets import Button, Label, Static

from ..storage.db import get_all_sessions
from ..widgets.session_card import SessionCard

CATEGORIES = ["all", "guided", "sleep_story", "soundscape"]
CATEGORY_LABELS = {
    "all": "All",
    "guided": "Guided",
    "sleep_story": "Sleep Story",
    "soundscape": "Soundscape",
}


class LibraryScreen(Screen):
    """Session library with category filter buttons."""

    BINDINGS = [("escape", "app.switch_screen('home')", "Home")]

    DEFAULT_CSS = """
    LibraryScreen {
        layout: vertical;
    }
    #lib-header {
        height: 5;
        background: $panel;
        border-bottom: solid $accent 20%;
        padding: 1 2;
        layout: horizontal;
        align: left middle;
    }
    #lib-header Label {
        text-style: bold;
        color: $accent;
        width: 1fr;
    }
    #filter-bar {
        height: 3;
        layout: horizontal;
        padding: 0 2;
        background: $panel;
        align: left middle;
    }
    #filter-bar Button {
        margin-right: 1;
        min-width: 14;
        height: 3;
    }
    #filter-bar Button.active {
        background: $accent 30%;
        border: solid $accent;
    }
    #session-list {
        padding: 1 2;
    }
    """

    active_filter: reactive[str] = reactive("all")

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._all_sessions: list[dict] = []

    def compose(self) -> ComposeResult:
        with Static(id="lib-header"):
            yield Label("Session Library")
        with Static(id="filter-bar"):
            for cat in CATEGORIES:
                classes = "active" if cat == "all" else ""
                yield Button(
                    CATEGORY_LABELS[cat],
                    id=f"filter-{cat}",
                    classes=classes,
                )
        with VerticalScroll(id="session-list"):
            yield Label("Loading…", id="loading-label")

    async def on_mount(self) -> None:
        self._all_sessions = await get_all_sessions()
        await self._render_sessions()

    async def _render_sessions(self) -> None:
        scroll = self.query_one("#session-list", VerticalScroll)
        await scroll.remove_children()

        filtered = self._all_sessions
        if self.active_filter != "all":
            filtered = [s for s in self._all_sessions if s.get("category") == self.active_filter]

        if not filtered:
            await scroll.mount(Label("No sessions found.", classes="text-muted"))
            return

        for session in filtered:
            await scroll.mount(SessionCard(session))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        btn_id = event.button.id or ""
        if btn_id.startswith("filter-"):
            cat = btn_id[len("filter-"):]
            self._set_filter(cat)

    def _set_filter(self, cat: str) -> None:
        # Update button active classes
        for c in CATEGORIES:
            btn = self.query_one(f"#filter-{c}", Button)
            if c == cat:
                btn.add_class("active")
            else:
                btn.remove_class("active")
        self.active_filter = cat
        self.app.call_after_refresh(self._render_sessions)

    async def watch_active_filter(self, value: str) -> None:
        if self._all_sessions:
            await self._render_sessions()

    def on_session_card_selected(self, event: SessionCard.Selected) -> None:
        from .session_detail import SessionDetailScreen

        self.app.push_screen(SessionDetailScreen(event.session))

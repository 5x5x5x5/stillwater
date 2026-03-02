"""StillwaterApp — main Textual application."""

from __future__ import annotations

from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.screen import ModalScreen
from textual.widgets import Button, Footer, Header, Input, Label, Static

from .audio.ambient import AmbientMixer
from .audio.engine import AudioEngine
from .screens.breathing import BreathingScreen
from .screens.home import HomeScreen
from .screens.library import LibraryScreen
from .screens.progress import ProgressScreen
from .storage.db import get_identity, init_db, set_identity
from .storage.progress import append_log
from .widgets.player_bar import PlayerBar


class NamePromptScreen(ModalScreen):
    """First-run name prompt modal."""

    DEFAULT_CSS = """
    NamePromptScreen {
        align: center middle;
    }
    #name-box {
        width: 50;
        height: auto;
        background: $panel;
        border: solid $accent;
        padding: 3 4;
        align: center top;
    }
    #name-title {
        text-style: bold;
        color: $accent;
        text-align: center;
        width: 100%;
        margin-bottom: 1;
    }
    #name-subtitle {
        color: $text-muted;
        text-align: center;
        width: 100%;
        margin-bottom: 2;
    }
    #name-input {
        width: 100%;
        margin-bottom: 2;
    }
    #name-submit {
        width: 100%;
    }
    """

    BINDINGS = [("enter", "submit", "Continue")]

    def compose(self) -> ComposeResult:
        with Static(id="name-box"):
            yield Label("Welcome to Stillwater", id="name-title")
            yield Label("What's your name?", id="name-subtitle")
            yield Input(placeholder="Your name…", id="name-input")
            yield Button("Continue →", id="name-submit", variant="primary")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "name-submit":
            self.action_submit()

    def action_submit(self) -> None:
        name_input = self.query_one("#name-input", Input)
        name = name_input.value.strip() or "Friend"
        self.dismiss(name)


class StillwaterApp(App):
    """The main Stillwater TUI application."""

    CSS = """
    Screen {
        background: #0f1729;
        color: #f8f4ef;
    }
    Header {
        background: #1a2340;
        color: #c4b5e0;
    }
    Footer {
        background: #1a2340;
        color: #888888;
    }
    Button {
        background: #c4b5e0 20%;
        border: tall #c4b5e0 40%;
        color: #f8f4ef;
    }
    Button:hover {
        background: #c4b5e0 35%;
        border: tall #c4b5e0;
    }
    Button:focus {
        border: tall #f8f4ef;
    }
    Button.-primary {
        background: #c4b5e0 40%;
        border: tall #c4b5e0;
    }
    Button.-primary:hover {
        background: #c4b5e0 60%;
    }
    $accent: #c4b5e0;
    $positive: #a8c5a0;
    $warm: #f5e6cc;
    $panel: #1a2340;
    $text: #f8f4ef;
    $text-muted: #8899aa;
    Input {
        background: #1a2340;
        border: tall #c4b5e0 40%;
        color: #f8f4ef;
    }
    Input:focus {
        border: tall #c4b5e0;
    }
    Select {
        background: #1a2340;
        border: tall #c4b5e0 40%;
        color: #f8f4ef;
    }
    """

    BINDINGS = [
        Binding("h", "switch_screen('home')", "Home", show=True),
        Binding("l", "switch_screen('library')", "Library", show=True),
        Binding("p", "switch_screen('progress')", "Progress", show=True),
        Binding("b", "switch_screen('breathing')", "Breathing", show=True),
        Binding("space", "toggle_playback", "Play/Pause", show=True),
        Binding("q", "quit", "Quit", show=True),
    ]

    SCREENS = {
        "home": HomeScreen,
        "library": LibraryScreen,
        "progress": ProgressScreen,
        "breathing": BreathingScreen,
    }

    TITLE = "Stillwater"

    def __init__(self) -> None:
        super().__init__()
        self._audio = AudioEngine()
        self._ambient = AmbientMixer()

    def compose(self) -> ComposeResult:
        yield Header()
        yield Footer()
        yield PlayerBar(id="player-bar")

    async def on_mount(self) -> None:
        await init_db()

        # Wire audio progress callback
        def on_progress(elapsed: int, total: int) -> None:
            self.call_from_thread(self._update_player_progress, elapsed, total)

        def on_end() -> None:
            self.call_from_thread(self._on_session_ended)

        self._audio.set_progress_callback(on_progress)
        self._audio.set_end_callback(on_end)

        # Check identity
        name = await get_identity()
        if not name:
            result = await self.push_screen_wait(NamePromptScreen())
            if result:
                await set_identity(result)

        # Push home screen
        await self.push_screen("home")

    def _update_player_progress(self, elapsed: int, total: int) -> None:
        try:
            bar = self.query_one("#player-bar", PlayerBar)
            bar.update_progress(elapsed, total)
            bar.playing = self._audio.is_playing
        except Exception:
            pass

    def _on_session_ended(self) -> None:
        """Called from audio thread when session ends naturally."""
        session = self._audio.current_session
        if session:
            duration = session.get("duration_seconds", 0)
            self.run_worker(
                self._log_session(session.get("id"), duration, True),
                exclusive=False,
            )
        try:
            bar = self.query_one("#player-bar", PlayerBar)
            bar.playing = False
        except Exception:
            pass

    async def _log_session(
        self, session_id: int | None, duration: int, completed: bool
    ) -> None:
        await append_log(session_id, duration, completed)

    def start_session(self, session: dict) -> None:
        """Start audio playback for a session."""
        self._audio.play(session)
        try:
            bar = self.query_one("#player-bar", PlayerBar)
            bar.set_session(session)
        except Exception:
            pass

    def action_toggle_playback(self) -> None:
        if self._audio.is_playing:
            self._audio.pause()
            try:
                self.query_one("#player-bar", PlayerBar).playing = False
            except Exception:
                pass
        elif self._audio.is_paused:
            self._audio.resume()
            try:
                self.query_one("#player-bar", PlayerBar).playing = True
            except Exception:
                pass

    def on_player_bar_play_pause(self) -> None:
        self.action_toggle_playback()

    def on_player_bar_stop(self) -> None:
        self._audio.stop()
        try:
            self.query_one("#player-bar", PlayerBar).clear_session()
        except Exception:
            pass

    def on_unmount(self) -> None:
        self._audio.shutdown()
        self._ambient.shutdown()

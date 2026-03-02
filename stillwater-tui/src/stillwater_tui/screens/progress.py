"""ProgressScreen — streak, heatmap, badges, and summary stats."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import VerticalScroll
from textual.screen import Screen
from textual.widgets import Label, Static

from ..storage.progress import get_badges, get_heatmap, get_progress_summary, get_streak
from ..widgets.badge_card import BadgeCard
from ..widgets.heatmap import HeatmapWidget


class ProgressScreen(Screen):
    """Progress screen showing streak, heatmap, stats, and badges."""

    BINDINGS = [("escape", "app.switch_screen('home')", "Home")]

    DEFAULT_CSS = """
    ProgressScreen {
        layout: vertical;
    }
    #progress-header {
        height: 5;
        background: $panel;
        border-bottom: solid $accent 20%;
        padding: 1 3;
        layout: horizontal;
        align: left middle;
    }
    #progress-header Label {
        text-style: bold;
        color: $accent;
        width: 1fr;
    }
    #progress-scroll {
        padding: 1 3;
    }
    .section-title {
        text-style: bold;
        color: $accent;
        margin-top: 2;
        margin-bottom: 1;
    }
    #streak-row {
        layout: horizontal;
        height: auto;
        margin-bottom: 1;
    }
    .streak-box {
        border: solid $accent 30%;
        padding: 1 3;
        margin-right: 2;
        height: auto;
        min-width: 20;
    }
    .streak-value {
        text-style: bold;
        color: $accent;
        text-align: center;
        width: 100%;
    }
    .streak-label {
        color: $text-muted;
        text-align: center;
        width: 100%;
    }
    #stats-row {
        layout: horizontal;
        height: auto;
        margin-bottom: 1;
    }
    .stat-box {
        border: solid $accent 20%;
        padding: 1 2;
        margin-right: 2;
        height: auto;
        min-width: 18;
    }
    .stat-value {
        text-style: bold;
        color: $text;
        text-align: center;
        width: 100%;
    }
    .stat-label {
        color: $text-muted;
        text-align: center;
        width: 100%;
    }
    #badge-grid {
        layout: horizontal;
        flex-wrap: wrap;
        height: auto;
    }
    """

    async def compose(self) -> ComposeResult:
        with Static(id="progress-header"):
            yield Label("📊  My Progress")
        with VerticalScroll(id="progress-scroll"):
            yield Label("Loading…", id="loading-msg")

    async def on_mount(self) -> None:
        await self._load_data()

    async def _load_data(self) -> None:
        streak = await get_streak()
        summary = await get_progress_summary()
        heatmap_data = await get_heatmap()
        badges = await get_badges()

        scroll = self.query_one("#progress-scroll", VerticalScroll)
        await scroll.remove_children()

        # Streak section
        await scroll.mount(Label("🔥  Streak", classes="section-title"))
        streak_row = Static(id="streak-row")
        await scroll.mount(streak_row)

        current_box = Static(classes="streak-box")
        await streak_row.mount(current_box)
        await current_box.mount(Label(str(streak["current_streak"]), classes="streak-value"))
        await current_box.mount(Label("Current Streak", classes="streak-label"))

        longest_box = Static(classes="streak-box")
        await streak_row.mount(longest_box)
        await longest_box.mount(Label(str(streak["longest_streak"]), classes="streak-value"))
        await longest_box.mount(Label("Longest Streak", classes="streak-label"))

        # Summary stats
        await scroll.mount(Label("📈  Summary", classes="section-title"))
        stats_row = Static(id="stats-row")
        await scroll.mount(stats_row)

        sessions_box = Static(classes="stat-box")
        await stats_row.mount(sessions_box)
        await sessions_box.mount(Label(str(summary["total_sessions"]), classes="stat-value"))
        await sessions_box.mount(Label("Sessions", classes="stat-label"))

        minutes_box = Static(classes="stat-box")
        await stats_row.mount(minutes_box)
        await minutes_box.mount(Label(str(summary["total_minutes"]), classes="stat-value"))
        await minutes_box.mount(Label("Minutes", classes="stat-label"))

        cats_box = Static(classes="stat-box")
        await stats_row.mount(cats_box)
        await cats_box.mount(Label(str(summary["categories_explored"]), classes="stat-value"))
        await cats_box.mount(Label("Categories", classes="stat-label"))

        # Heatmap
        await scroll.mount(Label("📅  Activity (last 52 weeks)", classes="section-title"))
        heatmap = HeatmapWidget(heatmap_data=heatmap_data)
        await scroll.mount(heatmap)

        # Badges
        await scroll.mount(Label("🏅  Badges", classes="section-title"))
        badge_grid = Static(id="badge-grid")
        await scroll.mount(badge_grid)
        for badge in badges:
            await badge_grid.mount(BadgeCard(badge))

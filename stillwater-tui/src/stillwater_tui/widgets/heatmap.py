"""HeatmapWidget — 52×7 activity grid for the past year."""

from __future__ import annotations

from datetime import date, timedelta

from rich.text import Text
from textual.widget import Widget

# Heat levels → colors (navy background scale)
HEAT_COLORS = [
    "#1a2340",  # 0 sessions — near-navy
    "#3d5273",  # 1
    "#6a7fa8",  # 2
    "#c4b5e0",  # 3
    "#e8d5ff",  # 4+
]


def _heat_color(count: int) -> str:
    if count == 0:
        return HEAT_COLORS[0]
    if count == 1:
        return HEAT_COLORS[1]
    if count == 2:
        return HEAT_COLORS[2]
    if count == 3:
        return HEAT_COLORS[3]
    return HEAT_COLORS[4]


class HeatmapWidget(Widget):
    """Renders a 52-week × 7-day heatmap using Rich colored blocks."""

    DEFAULT_CSS = """
    HeatmapWidget {
        height: auto;
        padding: 1 0;
    }
    """

    def __init__(self, heatmap_data: dict[str, int] | None = None, **kwargs) -> None:
        super().__init__(**kwargs)
        self._data: dict[str, int] = heatmap_data or {}

    def update_data(self, data: dict[str, int]) -> None:
        self._data = data
        self.refresh()

    def render(self) -> Text:
        text = Text()

        today = date.today()
        # Start from 364 days ago, aligned to Monday
        start = today - timedelta(days=363)
        # Rewind to the previous Sunday (or keep if already Sunday; weekday 6=Sunday)
        start -= timedelta(days=(start.weekday() + 1) % 7)

        # Build 7 rows (Sun=0 … Sat=6)
        rows: list[list[tuple[str, str]]] = [[] for _ in range(7)]
        current = start
        while current <= today + timedelta(days=6):
            day_idx = (current.weekday() + 1) % 7  # Sun=0, Mon=1...
            iso = current.isoformat()
            count = self._data.get(iso, 0)
            color = _heat_color(count)
            # Mark today with a different character
            if current == today:
                cell = ("▣ ", color)
            else:
                cell = ("■ ", color)
            rows[day_idx].append(cell)
            current += timedelta(days=1)

        # Day labels
        day_labels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

        for day_idx in range(7):
            text.append(f"{day_labels[day_idx]} ", style="#888888")
            for cell_char, color in rows[day_idx]:
                text.append(cell_char, style=color)
            text.append("\n")

        return text

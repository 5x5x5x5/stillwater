"""Entry point for stillwater-tui."""

from __future__ import annotations


def run() -> None:
    from .app import StillwaterApp

    app = StillwaterApp()
    app.run()


if __name__ == "__main__":
    run()

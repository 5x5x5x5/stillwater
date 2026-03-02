"""Stillwater FastAPI application factory and startup configuration."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import stillwater.models  # noqa: F401 — register models with Base
from stillwater.config import settings
from stillwater.db import Base, engine
from stillwater.routers.auth import router as auth_router
from stillwater.routers.progress import router as progress_router
from stillwater.routers.sessions import router as sessions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown lifecycle.

    In DEBUG mode the database tables are created automatically on startup,
    which is convenient for local development without running Alembic.
    """
    if settings.DEBUG:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Stillwater", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(progress_router)


@app.get("/api/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Return a simple liveness check response.

    Returns:
        A JSON object with ``status`` and ``app`` keys.
    """
    return {"status": "ok", "app": "stillwater"}

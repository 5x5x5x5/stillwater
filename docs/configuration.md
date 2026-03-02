# Configuration

All backend settings are read from environment variables, with `.env` file support via pydantic-settings.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./stillwater.db` | Database connection string |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | JWT signing key |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `DEBUG` | `true` | Enables auto table creation on startup |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | JWT expiration |

## Example `.env`

```
DATABASE_URL=sqlite+aiosqlite:///./stillwater.db
SECRET_KEY=dev-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5173
DEBUG=true
```

## Production (PostgreSQL)

Switch the database URL to PostgreSQL:

```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/stillwater
SECRET_KEY=<long-random-string>
CORS_ORIGINS=https://yourdomain.com
DEBUG=false
```

The schema avoids PostgreSQL-only features, so switching databases requires no code changes.

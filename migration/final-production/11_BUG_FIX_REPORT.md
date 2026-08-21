# Bug Fix Report

## Fixes Applied
1. Fixed hardcoded localhost:8001 URL in offer detail page
2. Removed localStorage usage for offer/onboarding data (5 files)
3. Added health endpoint for Docker health checks
4. Fixed Docker signal handling (entrypoint script)
5. Added non-root Docker users for security
6. Separated test dependencies from production
7. Added database connection pool settings
8. Added structured logging
9. **Fixed health endpoint SQLAlchemy 2.0 syntax** — `conn.execute("SELECT 1")` → `conn.execute(text("SELECT 1"))`
10. **Fixed Dockerfile entrypoint permissions** — Added `chmod +x` for `docker-entrypoint.sh`

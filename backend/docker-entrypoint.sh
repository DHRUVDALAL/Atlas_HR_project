#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for the database to accept connections..."
python - <<'PY'
import os, time, sys
import sqlalchemy

url = os.environ["DATABASE_URL"]
for attempt in range(30):
    try:
        sqlalchemy.create_engine(url).connect().close()
        print("Database is up.")
        break
    except Exception as exc:
        print(f"  db not ready ({attempt+1}/30): {exc}")
        time.sleep(2)
else:
    print("Database never became ready.", file=sys.stderr)
    sys.exit(1)
PY

echo "Applying database migrations..."
alembic upgrade head

echo "Seeding bootstrap data..."
python -m database.seed

echo "Starting: $*"
exec "$@"

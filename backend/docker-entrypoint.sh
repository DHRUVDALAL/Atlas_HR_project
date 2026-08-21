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

echo "Seeding interview reference data (domains + experience brackets)..."
python -c "
from database.connection import SessionLocal
from services.excel_import_service import seed_interview_reference_data
db = SessionLocal()
try:
    result = seed_interview_reference_data(db)
    print(f'  Domains: {result[\"domains_after\"]}, Brackets: {result[\"brackets_after\"]}')
finally:
    db.close()
"

echo "Importing SAP interview questions from Excel..."
python -c "
from database.connection import SessionLocal
from services.excel_import_service import import_excel
db = SessionLocal()
try:
    stats = import_excel(db)
    print(f'  Imported {stats[\"imported\"]} questions from {stats[\"total_rows\"]} rows')
    if stats['errors'] > 0:
        print(f'  WARNING: {stats[\"errors\"]} errors during import')
except FileNotFoundError as e:
    print(f'  Excel file not found: {e}')
    print('  Reference data (domains + brackets) is still available.')
except Exception as e:
    print(f'  Excel import failed: {e}')
    print('  Reference data (domains + brackets) is still available.')
finally:
    db.close()
" || echo "  Excel import skipped (non-fatal — reference data is available)"

echo "Starting: $*"
exec "$@"

"""
CLI script to seed interview reference data (domains + experience brackets)
without requiring the Excel file.

Usage:
    cd backend
    python -m scripts.seed_reference_data
"""

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import SessionLocal
from services.excel_import_service import seed_interview_reference_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

db = SessionLocal()
try:
    result = seed_interview_reference_data(db)
    print("\n=== Reference Data Seeded ===")
    print(f"Domains before:  {result['domains_before']}")
    print(f"Domains after:   {result['domains_after']}")
    print(f"Brackets before: {result['brackets_before']}")
    print(f"Brackets after:  {result['brackets_after']}")
except Exception as e:
    print(f"Seeding failed: {e}", file=sys.stderr)
    sys.exit(1)
finally:
    db.close()

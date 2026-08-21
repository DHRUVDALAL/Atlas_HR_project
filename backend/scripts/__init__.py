"""
CLI script to import SAP Technical Questions from Excel into the database.

Usage:
    cd backend
    python -m scripts.import_questions
"""

import sys
import os

# Ensure backend root is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.excel_import_service import run_import

if __name__ == "__main__":
    run_import()

"""
Excel Import Engine — reads SAP_Technical_Question_Bank_By_Experience.xlsx
and populates the interview engine database tables.

Run with: python -m scripts.import_questions
"""

import os
import sys
import uuid
import logging
from typing import Dict, List, Tuple

import openpyxl
from sqlalchemy.orm import Session

from database.connection import SessionLocal
from models.interview_engine import (
    SapDomain,
    ExperienceBracket,
    TechnicalTopic,
)

logger = logging.getLogger(__name__)

EXCEL_FILENAME = "SAP_new_question_bank.xlsx"

# Canonical domain definitions — restricted to only the following
DOMAIN_DEFINITIONS: List[Tuple[str, str, str]] = [
    ("FI", "Financial Accounting", "Core accounting implementation"),
    ("CO", "Controlling", "Management accounting"),
    ("MM", "Materials Management", "Procurement and inventory"),
    ("SD", "Sales & Distribution", "Order-to-cash process"),
    ("PP", "Production Planning", "Manufacturing execution"),
    ("QM", "Quality Management", "Quality planning and inspection"),
    ("PM", "Plant Maintenance", "Enterprise asset management"),
    ("WM", "Warehouse Management", "Warehouse operations"),
    ("HCM", "Human Capital Management", "Core HR and payroll"),
    ("BASIS", "Basis / Technical & ABAP", "System administration and development"),
    ("REC", "HR Recruiter", "Talent acquisition"),
    ("COMP", "HR Compliance & Onboarding", "Statutory compliance and joining"),
    ("MGR", "HR Manager", "HR strategy and leadership"),
    ("SNM", "Sales & Marketing", "Sales and marketing strategy"),
    ("GFX", "Graphics / Design", "UI/UX and graphic design"),
    ("SAC", "SAP SAC & Datasphere", "SAP Analytics Cloud and Datasphere"),
    ("AI", "Artificial Intelligence", "AI and machine learning"),
    ("FIN", "Finance & Accounts", "Finance and accounts operations"),
]

# Canonical experience bracket definitions
BRACKET_DEFINITIONS: List[Tuple[str, str, float, float]] = [
    ("0-3 yrs", "Associate / Junior (0-3 yrs)", 0.0, 3.0),
    ("3-7 yrs", "Consultant / Sr Consultant (3-7 yrs)", 3.0, 7.0),
    ("7+ yrs", "Lead / Architect (7+ yrs)", 7.0, None),
]

# Map Excel module codes to our domain codes
MODULE_TO_DOMAIN: Dict[str, str] = {
    "FI": "FI",
    "CO": "CO",
    "MM": "MM",
    "SD": "SD",
    "PP": "PP",
    "QM": "QM",
    "PM": "PM",
    "WM": "WM",
    "HCM": "HCM",
    "BASIS": "BASIS",
    "REC": "REC",
    "COMP": "COMP",
    "MGR": "MGR",
    "SNM": "SNM",
    "GFX": "GFX",
    "SAC": "SAC",
    "AI": "AI",
    "FIN": "FIN",
}

# Map Excel bracket codes to our bracket codes
BRACKET_MAP: Dict[str, str] = {
    "0-3 yrs": "0-3 yrs",
    "3-7 yrs": "3-7 yrs",
    "7+ yrs": "7+ yrs",
}


def _find_excel_path() -> str:
    """Locate the Excel file relative to the backend directory."""
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidates = [
        os.path.join(base, EXCEL_FILENAME),
        os.path.join(base, "..", EXCEL_FILENAME),
        os.path.join(os.getcwd(), EXCEL_FILENAME),
        os.path.join(base, "..", "backend", EXCEL_FILENAME),
    ]
    for p in candidates:
        if os.path.isfile(p):
            return os.path.abspath(p)
    raise FileNotFoundError(
        f"Excel file '{EXCEL_FILENAME}' not found. "
        f"Searched: {candidates}"
    )


def _ensure_domains(db: Session) -> Dict[str, SapDomain]:
    """Upsert all domain definitions and return code→model mapping."""
    domains = {}
    for code, name, description in DOMAIN_DEFINITIONS:
        existing = db.query(SapDomain).filter(SapDomain.code == code).first()
        if existing:
            existing.name = name
            existing.description = description
            domains[code] = existing
        else:
            d = SapDomain(id=uuid.uuid4(), code=code, name=name, description=description)
            db.add(d)
            domains[code] = d
    db.commit()
    logger.info("Ensured %d domains in database", len(domains))
    return domains


def _ensure_brackets(db: Session) -> Dict[str, ExperienceBracket]:
    """Upsert all bracket definitions and return code→model mapping."""
    brackets = {}
    for code, label, min_y, max_y in BRACKET_DEFINITIONS:
        existing = db.query(ExperienceBracket).filter(ExperienceBracket.code == code).first()
        if existing:
            existing.label = label
            existing.min_years = min_y
            existing.max_years = max_y
            brackets[code] = existing
        else:
            b = ExperienceBracket(
                id=uuid.uuid4(), code=code, label=label,
                min_years=min_y, max_years=max_y,
            )
            db.add(b)
            brackets[code] = b
    db.commit()
    logger.info("Ensured %d experience brackets in database", len(brackets))
    return brackets


def seed_interview_reference_data(db: Session) -> dict:
    """
    Seed domains and experience brackets independently of Excel import.
    This is idempotent — safe to call multiple times.
    Returns a summary of what was created.
    """
    existing_domains = db.query(SapDomain).count()
    existing_brackets = db.query(ExperienceBracket).count()

    domains = _ensure_domains(db)
    brackets = _ensure_brackets(db)

    return {
        "domains_before": existing_domains,
        "domains_after": len(domains),
        "brackets_before": existing_brackets,
        "brackets_after": len(brackets),
    }


def import_excel(db: Session) -> dict:
    """
    Main import function. Reads the Excel file and populates the database.
    Returns a summary dict with counts.
    """
    excel_path = _find_excel_path()
    logger.info("Reading Excel file: %s", excel_path)

    wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)

    # Ensure reference data exists
    domains = _ensure_domains(db)
    brackets = _ensure_brackets(db)

    # Get existing topics to update them instead of deleting (idempotent upsert)
    existing_topics = {t.question_id_code: t for t in db.query(TechnicalTopic).all()}
    logger.info("Found %d existing technical topics to update/skip", len(existing_topics))

    # Read the worksheet
    if "Upload_Master" in wb.sheetnames:
        ws = wb["Upload_Master"]
    elif "Sheet1" in wb.sheetnames:
        ws = wb["Sheet1"]
    else:
        ws = wb.active

    rows = list(ws.iter_rows(values_only=True))

    if not rows:
        raise ValueError("Upload_Master sheet is empty")

    headers = [str(h).strip() if h else f"col_{i}" for i, h in enumerate(rows[0])]
    logger.info("Upload_Master headers: %s", headers)

    # Find column indices
    col_map = {}
    for i, h in enumerate(headers):
        hl = h.lower().replace(" ", "_")
        if "question_id" in hl:
            col_map["question_id"] = i
        elif "module_code" in hl:
            col_map["module_code"] = i
        elif "module_name" in hl:
            col_map["module_name"] = i
        elif "bracket_label" in hl:
            col_map["bracket_label"] = i
        elif "experience_bracket" in hl or "bracket" in hl:
            col_map["experience_bracket"] = i
        elif "topic_category" in hl:
            col_map["topic_category"] = i
        elif "question_topic" in hl:
            col_map["question_topic"] = i
        elif "source" in hl:
            col_map["source"] = i
        elif "rating" in hl:
            col_map["rating"] = i

    logger.info("Column map: %s", col_map)

    stats = {
        "total_rows": 0,
        "imported": 0,
        "skipped": 0,
        "errors": 0,
        "by_domain": {},
        "by_bracket": {},
    }

    for row_idx, row in enumerate(rows[1:], start=2):
        stats["total_rows"] += 1

        try:
            question_id = str(row[col_map["question_id"]]).strip() if col_map.get("question_id") is not None and row[col_map["question_id"]] else None
            module_code = str(row[col_map["module_code"]]).strip() if col_map.get("module_code") is not None and row[col_map["module_code"]] else None
            module_name = str(row[col_map["module_name"]]).strip() if col_map.get("module_name") is not None and row[col_map["module_name"]] else None
            bracket_code = str(row[col_map["experience_bracket"]]).strip() if col_map.get("experience_bracket") is not None and row[col_map["experience_bracket"]] else None
            topic_category = str(row[col_map["topic_category"]]).strip() if col_map.get("topic_category") is not None and row[col_map["topic_category"]] else None
            question_topic = str(row[col_map["question_topic"]]).strip() if col_map.get("question_topic") is not None and row[col_map["question_topic"]] else None
            source = str(row[col_map["source"]]).strip() if col_map.get("source") is not None and row[col_map["source"]] else None

            if not question_id or not module_code or not bracket_code or not question_topic:
                stats["skipped"] += 1
                continue

            # Map module code to domain
            domain_code = MODULE_TO_DOMAIN.get(module_code.upper())
            if not domain_code:
                domain_code = module_code.upper()

            # Map bracket code
            bracket_mapped = BRACKET_MAP.get(bracket_code)
            if not bracket_mapped:
                stats["skipped"] += 1
                continue

            domain_model = domains.get(domain_code)
            bracket_model = brackets.get(bracket_mapped)

            if not domain_model or not bracket_model:
                stats["skipped"] += 1
                continue

            existing = existing_topics.get(question_id)
            if existing:
                existing.domain_id = domain_model.id
                existing.experience_bracket_id = bracket_model.id
                existing.module_code = module_code.upper()
                existing.module_name = module_name or module_code.upper()
                existing.topic_category = topic_category or "General"
                existing.question_topic = question_topic
                existing.source = source
            else:
                topic = TechnicalTopic(
                    id=uuid.uuid4(),
                    domain_id=domain_model.id,
                    experience_bracket_id=bracket_model.id,
                    question_id_code=question_id,
                    module_code=module_code.upper(),
                    module_name=module_name or module_code.upper(),
                    topic_category=topic_category or "General",
                    question_topic=question_topic,
                    source=source,
                    difficulty=None,
                    weight=None,
                )
                db.add(topic)
                existing_topics[question_id] = topic

            stats["imported"] += 1
            stats["by_domain"][domain_code] = stats["by_domain"].get(domain_code, 0) + 1
            stats["by_bracket"][bracket_mapped] = stats["by_bracket"].get(bracket_mapped, 0) + 1

        except Exception as e:
            stats["errors"] += 1
            logger.warning("Error processing row %d: %s", row_idx, str(e))
            continue

    db.commit()
    wb.close()

    logger.info(
        "Import complete: %d imported, %d skipped, %d errors",
        stats["imported"], stats["skipped"], stats["errors"],
    )
    logger.info("By domain: %s", stats["by_domain"])
    logger.info("By bracket: %s", stats["by_bracket"])

    return stats


def run_import():
    """CLI entry point for the import."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    db = SessionLocal()
    try:
        stats = import_excel(db)
        print("\n=== Import Results ===")
        print(f"Total rows:     {stats['total_rows']}")
        print(f"Imported:       {stats['imported']}")
        print(f"Skipped:        {stats['skipped']}")
        print(f"Errors:         {stats['errors']}")
        print(f"By domain:      {stats['by_domain']}")
        print(f"By bracket:     {stats['by_bracket']}")
    except Exception as e:
        print(f"Import failed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_import()

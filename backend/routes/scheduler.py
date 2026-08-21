from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from services.scheduler_service import run_daily_reminders, get_scheduler_status

router = APIRouter(prefix="/api/scheduler", tags=["Scheduler"])


@router.post("/run-daily")
def run_daily(
    db: Session = Depends(get_db),
    current_user: User = require_permission("scheduler.admin"),
):
    results = run_daily_reminders(db)
    return results


@router.get("/status")
def scheduler_status(
    db: Session = Depends(get_db),
    current_user: User = require_permission("scheduler.admin"),
):
    return get_scheduler_status(db)

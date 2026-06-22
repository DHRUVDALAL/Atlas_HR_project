"""
Applicant Form Intake Module — API Routes

Endpoints:
  POST   /api/applicants              — Create draft application
  GET    /api/applicants               — List applicants (paginated)
  GET    /api/applicants/{id}          — Get full application
  PUT    /api/applicants/{id}          — Update draft application
  POST   /api/applicants/{id}/submit   — Submit application
  POST   /api/applicants/{id}/signature — Upload signature PDF

All endpoints are PUBLIC (no auth). Auth will be integrated later.
Section 9 (Interview Panel Assessment) is NOT exposed here.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional

from database.connection import get_db
from schemas.applicant import (
    ApplicantFullCreate,
    ApplicantUpdate,
    ApplicantResponse,
    ApplicantListResponse,
    ApplicantListItem,
    DocumentResponse,
)
from services.applicant_service import (
    create_applicant,
    get_applicant,
    update_applicant,
    submit_applicant,
    list_applicants,
    save_signature,
)

router = APIRouter(
    prefix="/api/applicants",
    tags=["applicants"],
)


# ---------------------------------------------------------------------------
# POST /api/applicants — Create Draft Application
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=dict,
    status_code=201,
    summary="Create a new draft application",
    description=(
        "Creates a new applicant record with status DRAFT. "
        "Section 1 (Personal Details) is required. All other sections are optional "
        "and can be added later via the update endpoint."
    ),
)
def create_applicant_api(
    data: ApplicantFullCreate,
    db: Session = Depends(get_db),
):
    applicant = create_applicant(db, data)
    return {
        "success": True,
        "message": "Application created successfully",
        "data": ApplicantResponse.model_validate(applicant).model_dump(),
    }


# ---------------------------------------------------------------------------
# GET /api/applicants — List Applicants (paginated)
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=ApplicantListResponse,
    summary="List all applicants",
    description=(
        "Returns a paginated list of applicants. Supports optional status filter."
    ),
)
def list_applicants_api(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    status: Optional[str] = Query(
        None,
        description="Filter by status (DRAFT, SUBMITTED, UNDER_REVIEW, SHORTLISTED, REJECTED, HIRED)",
    ),
    db: Session = Depends(get_db),
):
    total, applicants = list_applicants(db, skip=skip, limit=limit, status_filter=status)
    return ApplicantListResponse(
        success=True,
        total=total,
        skip=skip,
        limit=limit,
        applicants=[
            ApplicantListItem.model_validate(a) for a in applicants
        ],
    )


# ---------------------------------------------------------------------------
# GET /api/applicants/{id} — Get Full Application
# ---------------------------------------------------------------------------

@router.get(
    "/{applicant_id}",
    response_model=dict,
    summary="Get applicant by ID",
    description="Returns the full applicant record with all sections.",
)
def get_applicant_api(
    applicant_id: str,
    db: Session = Depends(get_db),
):
    applicant = get_applicant(db, applicant_id)
    return {
        "success": True,
        "data": ApplicantResponse.model_validate(applicant).model_dump(),
    }


# ---------------------------------------------------------------------------
# PUT /api/applicants/{id} — Update Draft Application
# ---------------------------------------------------------------------------

@router.put(
    "/{applicant_id}",
    response_model=dict,
    summary="Update a draft application",
    description=(
        "Updates an existing DRAFT application. Only DRAFT applications can be updated. "
        "Provide only the sections you want to update — other sections remain unchanged."
    ),
)
def update_applicant_api(
    applicant_id: str,
    data: ApplicantUpdate,
    db: Session = Depends(get_db),
):
    applicant = update_applicant(db, applicant_id, data)
    return {
        "success": True,
        "message": "Application updated successfully",
        "data": ApplicantResponse.model_validate(applicant).model_dump(),
    }


# ---------------------------------------------------------------------------
# POST /api/applicants/{id}/submit — Submit Application
# ---------------------------------------------------------------------------

@router.post(
    "/{applicant_id}/submit",
    response_model=dict,
    summary="Submit an application",
    description=(
        "Submits a DRAFT application for review. "
        "Validates that required sections (Professional Details, Declaration) are present "
        "and that both declaration and consent are accepted."
    ),
)
def submit_applicant_api(
    applicant_id: str,
    db: Session = Depends(get_db),
):
    applicant = submit_applicant(db, applicant_id)
    return {
        "success": True,
        "message": "Application submitted successfully",
        "data": ApplicantResponse.model_validate(applicant).model_dump(),
    }


# ---------------------------------------------------------------------------
# POST /api/applicants/{id}/signature — Upload Signature PDF
# ---------------------------------------------------------------------------

@router.post(
    "/{applicant_id}/signature",
    response_model=dict,
    summary="Upload signature PDF",
    description=(
        "Uploads a digital signature as a PDF file. "
        "Only PDF files are accepted. Maximum file size is 5 MB."
    ),
)
def upload_signature_api(
    applicant_id: str,
    file: UploadFile = File(
        ...,
        description="Signature PDF file (max 5 MB)",
    ),
    db: Session = Depends(get_db),
):
    document = save_signature(db, applicant_id, file)
    return {
        "success": True,
        "message": "Signature uploaded successfully",
        "data": DocumentResponse.model_validate(document).model_dump(),
    }

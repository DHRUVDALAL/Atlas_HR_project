from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import os

from database.connection import get_db
from models.user import User
from middleware.role_auth import require_permission
from services.document_storage_service import (
    upload_document,
    get_documents,
    get_document,
    delete_document,
    get_document_versions,
    get_candidate_document_summary,
    get_storage_stats,
)

router = APIRouter(prefix="/api/documents", tags=["Document Storage"])


@router.post("/upload/{candidate_id}")
def upload_new_document(
    candidate_id: UUID,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = require_permission("document.upload"),
):
    content = file.file.read()
    return upload_document(
        db=db,
        candidate_id=candidate_id,
        uploaded_by=current_user.user_id,
        document_type=document_type,
        file=file,
        file_content=content,
    )


@router.get("/candidate/{candidate_id}")
def list_candidate_documents(
    candidate_id: UUID,
    document_type: Optional[str] = Query(None),
    include_all_versions: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = require_permission("document.view"),
):
    docs = get_documents(db, candidate_id, document_type=document_type, include_all_versions=include_all_versions)
    return {"items": docs, "total": len(docs)}


@router.get("/candidate/{candidate_id}/summary")
def candidate_document_summary(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = require_permission("document.view"),
):
    return get_candidate_document_summary(db, candidate_id)


@router.get("/{document_id}")
def get_single_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = require_permission("document.view"),
):
    return get_document(db, document_id)


@router.get("/{document_id}/download")
def download_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = require_permission("document.download"),
):
    doc = get_document(db, document_id)
    if not os.path.exists(doc.file_path):
        return {"error": "File not found on disk"}
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_name,
        media_type=doc.mime_type or "application/octet-stream",
    )


@router.get("/candidate/{candidate_id}/versions/{document_type}")
def document_versions(
    candidate_id: UUID,
    document_type: str,
    db: Session = Depends(get_db),
    current_user: User = require_permission("document.view"),
):
    versions = get_document_versions(db, candidate_id, document_type)
    return {"items": versions, "total": len(versions)}


@router.delete("/{document_id}")
def remove_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = require_permission("document.delete"),
):
    deleted = delete_document(db, document_id)
    return {"deleted": deleted}


@router.get("/stats/storage")
def storage_statistics(
    db: Session = Depends(get_db),
    current_user: User = require_permission("document.view"),
):
    return get_storage_stats(db)

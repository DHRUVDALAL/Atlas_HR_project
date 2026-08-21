import os
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from models.communications import DocumentStorage

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "10")) * 1024 * 1024
ALLOWED_TYPES = {
    "resume": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    "photograph": ["image/jpeg", "image/png"],
    "signature": ["application/pdf", "image/jpeg", "image/png"],
    "pan": ["application/pdf", "image/jpeg", "image/png"],
    "aadhar": ["application/pdf", "image/jpeg", "image/png"],
    "passport": ["application/pdf", "image/jpeg", "image/png"],
    "education": ["application/pdf", "image/jpeg", "image/png"],
    "experience": ["application/pdf", "image/jpeg", "image/png"],
    "offer": ["application/pdf"],
    "joining": ["application/pdf"],
    "verification": ["application/pdf", "image/jpeg", "image/png"],
    "medical": ["application/pdf", "image/jpeg", "image/png"],
    "other": ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
}


def _compute_checksum(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _get_storage_path(document_type: str, candidate_id: str, file_name: str) -> str:
    date_prefix = datetime.now().strftime("%Y/%m")
    type_dir = os.path.join(UPLOAD_DIR, document_type, date_prefix, candidate_id)
    os.makedirs(type_dir, exist_ok=True)
    ext = os.path.splitext(file_name)[1]
    unique_name = f"{uuid4().hex}{ext}"
    return os.path.join(type_dir, unique_name)


def validate_file(document_type: str, file: UploadFile, file_size: int) -> None:
    if document_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type: {document_type}",
        )
    if file.content_type and ALLOWED_TYPES[document_type] and file.content_type not in ALLOWED_TYPES[document_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}' for document type '{document_type}'",
        )
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size {file_size} exceeds maximum {MAX_FILE_SIZE}",
        )


def upload_document(
    db: Session,
    candidate_id: UUID,
    uploaded_by: UUID,
    document_type: str,
    file: UploadFile,
    file_content: bytes,
    meta: Optional[Dict[str, Any]] = None,
) -> DocumentStorage:
    validate_file(document_type, file, len(file_content))

    existing = (
        db.query(DocumentStorage)
        .filter(
            DocumentStorage.candidate_id == candidate_id,
            DocumentStorage.document_type == document_type,
            DocumentStorage.is_latest == True,
        )
        .first()
    )
    version = 1
    if existing:
        existing.is_latest = False
        existing.updated_at = datetime.now(timezone.utc)
        version = existing.version + 1

    file_path = _get_storage_path(document_type, str(candidate_id), file.filename or "unknown")
    with open(file_path, "wb") as f:
        f.write(file_content)

    checksum = _compute_checksum(file_content)

    doc = DocumentStorage(
        candidate_id=candidate_id,
        uploaded_by=uploaded_by,
        document_type=document_type,
        file_name=file.filename or "unknown",
        original_name=file.filename or "unknown",
        mime_type=file.content_type,
        file_size=len(file_content),
        file_path=file_path,
        version=version,
        is_latest=True,
        checksum=checksum,
        meta=meta,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_documents(
    db: Session,
    candidate_id: UUID,
    document_type: Optional[str] = None,
    include_all_versions: bool = False,
) -> List[DocumentStorage]:
    query = db.query(DocumentStorage).filter(DocumentStorage.candidate_id == candidate_id)
    if document_type:
        query = query.filter(DocumentStorage.document_type == document_type)
    if not include_all_versions:
        query = query.filter(DocumentStorage.is_latest == True)
    return query.order_by(DocumentStorage.document_type, DocumentStorage.version.desc()).all()


def get_document(db: Session, document_id: UUID) -> DocumentStorage:
    doc = db.query(DocumentStorage).filter(DocumentStorage.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


def delete_document(db: Session, document_id: UUID) -> bool:
    doc = get_document(db, document_id)
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return True


def get_document_versions(
    db: Session,
    candidate_id: UUID,
    document_type: str,
) -> List[DocumentStorage]:
    return (
        db.query(DocumentStorage)
        .filter(
            DocumentStorage.candidate_id == candidate_id,
            DocumentStorage.document_type == document_type,
        )
        .order_by(DocumentStorage.version.desc())
        .all()
    )


def get_candidate_document_summary(db: Session, candidate_id: UUID) -> Dict[str, Any]:
    docs = get_documents(db, candidate_id)
    by_type = {}
    for doc in docs:
        by_type[doc.document_type] = {
            "id": str(doc.id),
            "file_name": doc.file_name,
            "version": doc.version,
            "file_size": doc.file_size,
            "uploaded_at": doc.created_at.isoformat() if doc.created_at else None,
        }
    return {
        "candidate_id": str(candidate_id),
        "total_documents": len(docs),
        "documents": by_type,
    }


def get_storage_stats(db: Session) -> Dict[str, Any]:
    from sqlalchemy import func
    total = db.query(DocumentStorage).filter(DocumentStorage.is_latest == True).count()
    total_size = (
        db.query(func.sum(DocumentStorage.file_size))
        .filter(DocumentStorage.is_latest == True)
        .scalar()
        or 0
    )
    return {
        "total_documents": total,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
    }

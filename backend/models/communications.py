import uuid
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Index,
)
from sqlalchemy.dialects.postgresql import UUID as pgUUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(pgUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="info", index=True)
    category = Column(String(50), nullable=False, default="system", index=True)
    priority = Column(String(20), nullable=False, default="normal")
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    action_url = Column(String(500), nullable=True)
    meta = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_notifications_user_unread", "user_id", "is_read"),
    )


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(pgUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(String(100), nullable=True, index=True)
    entity_label = Column(String(255), nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_activity_logs_action_created", "action", "created_at"),
        Index("ix_activity_logs_entity", "entity_type", "entity_id"),
    )


class DocumentStorage(Base):
    __tablename__ = "document_storage"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(pgUUID(as_uuid=True), ForeignKey("candidates.candidate_id"), nullable=True, index=True)
    uploaded_by = Column(pgUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    document_type = Column(String(50), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_path = Column(String(500), nullable=False)
    version = Column(Integer, default=1, nullable=False)
    is_latest = Column(Boolean, default=True, nullable=False)
    meta = Column(JSONB, nullable=True)
    checksum = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_document_storage_candidate_type", "candidate_id", "document_type"),
    )


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(pgUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    search_type = Column(String(50), nullable=False)
    filters = Column(JSONB, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    use_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

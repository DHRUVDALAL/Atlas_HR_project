import uuid
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Index,
)
from sqlalchemy.dialects.postgresql import UUID as pgUUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body_html = Column(Text, nullable=False)
    body_text = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default="general")
    is_active = Column(Boolean, default=True, nullable=False)
    variables = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EmailHistory(Base):
    __tablename__ = "email_history"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_code = Column(String(100), nullable=True)
    recipient_email = Column(String(255), nullable=False, index=True)
    recipient_name = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=False)
    body_html = Column(Text, nullable=True)
    body_text = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    meta = Column(JSONB, nullable=True)

    __table_args__ = (
        Index("ix_email_history_status_created", "status", "created_at"),
    )


class EmailQueue(Base):
    __tablename__ = "email_queue"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    history_id = Column(pgUUID(as_uuid=True), ForeignKey("email_history.id"), nullable=False, index=True)
    priority = Column(Integer, default=0, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    locked = Column(Boolean, default=False, nullable=False)
    locked_at = Column(DateTime(timezone=True), nullable=True)
    locked_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    history = relationship("EmailHistory")

    __table_args__ = (
        Index("ix_email_queue_scheduled_locked", "scheduled_at", "locked"),
    )

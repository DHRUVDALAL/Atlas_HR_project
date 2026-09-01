import uuid
import datetime

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Integer, Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database.connection import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    secondary_role_id = Column(UUID(as_uuid=True), ForeignKey("roles.role_id"), nullable=True)
    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey("roles.role_id"),
        nullable=False,
        index=True,
    )
    employee_code = Column(String(20), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(254), unique=True, index=True, nullable=False)
    mobile_no = Column(String(15))
    password = Column(String, nullable=False)  # bcrypt hash
    # Free-text department label until a departments table exists.
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    role = relationship("Role", foreign_keys=[role_id])
    secondary_role = relationship("Role", foreign_keys=[secondary_role_id])
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    token_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # SHA-256 hex of the token; the raw token is never stored.
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="refresh_tokens")


Index("ix_refresh_tokens_user_active", RefreshToken.user_id, RefreshToken.is_revoked)

import uuid

from sqlalchemy import Column, String, Table, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database.connection import Base

# Many-to-many: a role holds a set of permissions.
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column(
        "role_id",
        UUID(as_uuid=True),
        ForeignKey("roles.role_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "permission_id",
        UUID(as_uuid=True),
        ForeignKey("permissions.permission_id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Permission(Base):
    __tablename__ = "permissions"

    permission_id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # A stable machine code such as "candidate.list" or "workflow.hr_review".
    # Code checks against this string, never against a role NAME — so new roles
    # are pure data and interview panels stretch without code changes.
    code = Column(String(64), unique=True, index=True, nullable=False)
    description = Column(String(200), nullable=True)

    roles = relationship(
        "Role", secondary=role_permissions, back_populates="permissions"
    )

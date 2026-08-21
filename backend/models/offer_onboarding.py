"""
Offer Management & Employee Onboarding — SQLAlchemy Models

Tables:
  - offers (Offer management records)
  - offer_documents (Offer-related documents)
  - offer_history (Offer status change history)
  - onboarding (Employee onboarding records)
  - document_verification (Document verification status)
  - background_verification (Background check status)
  - asset_allocation (IT asset allocation)
  - employee_checklist (Onboarding checklist items)
  - onboarding_activity (Onboarding audit trail)
"""

import uuid
from sqlalchemy import (
    Column, String, Text, Boolean, Date, DateTime,
    ForeignKey, Numeric, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


# ---------------------------------------------------------------------------
# Offers — One per candidate, tracks offer lifecycle
# ---------------------------------------------------------------------------

class Offer(Base):
    __tablename__ = "offers"

    offer_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    status = Column(
        String(20), nullable=False, default="DRAFT", index=True
    )  # DRAFT, SENT, ACCEPTED, DECLINED
    offered_ctc = Column(Numeric(12, 2), nullable=True)
    joining_date = Column(Date, nullable=True)
    approved_by = Column(String(100), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    candidate = relationship("Applicant", backref="offer")
    documents = relationship(
        "OfferDocument",
        back_populates="offer",
        cascade="all, delete-orphan",
    )
    history = relationship(
        "OfferHistory",
        back_populates="offer",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED')",
            name="ck_offers_status",
        ),
        CheckConstraint(
            "offered_ctc IS NULL OR offered_ctc > 0",
            name="ck_offered_ctc_positive",
        ),
    )


# ---------------------------------------------------------------------------
# Offer Documents — Documents attached to offers
# ---------------------------------------------------------------------------

class OfferDocument(Base):
    __tablename__ = "offer_documents"

    document_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    offer_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("offers.offer_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type = Column(
        String(50), nullable=False
    )  # OFFER_LETTER, SIGNED_OFFER, ADDENDUM, OTHER
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(String(100), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    offer = relationship("Offer", back_populates="documents")

    __table_args__ = (
        CheckConstraint(
            "document_type IN ('OFFER_LETTER', 'SIGNED_OFFER', 'ADDENDUM', 'OTHER')",
            name="ck_offer_documents_type",
        ),
    )


# ---------------------------------------------------------------------------
# Offer History — Audit trail for offer status changes
# ---------------------------------------------------------------------------

class OfferHistory(Base):
    __tablename__ = "offer_history"

    history_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    offer_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("offers.offer_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action = Column(String(100), nullable=False)
    performed_by = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    offer = relationship("Offer", back_populates="history")


# ---------------------------------------------------------------------------
# Onboarding — One per candidate, tracks onboarding lifecycle
# ---------------------------------------------------------------------------

class Onboarding(Base):
    __tablename__ = "onboarding"

    onboarding_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    status = Column(
        String(20), nullable=False, default="PENDING", index=True
    )  # PENDING, IN_PROGRESS, COMPLETED
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    candidate = relationship("Applicant", backref="onboarding")
    documents = relationship(
        "DocumentVerification",
        back_populates="onboarding",
        cascade="all, delete-orphan",
    )
    background_checks = relationship(
        "BackgroundVerification",
        back_populates="onboarding",
        cascade="all, delete-orphan",
    )
    assets = relationship(
        "AssetAllocation",
        back_populates="onboarding",
        cascade="all, delete-orphan",
    )
    checklist = relationship(
        "EmployeeChecklist",
        back_populates="onboarding",
        cascade="all, delete-orphan",
    )
    activities = relationship(
        "OnboardingActivity",
        back_populates="onboarding",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')",
            name="ck_onboarding_status",
        ),
    )


# ---------------------------------------------------------------------------
# Document Verification — Tracks verification status for each document type
# ---------------------------------------------------------------------------

class DocumentVerification(Base):
    __tablename__ = "document_verification"

    verification_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    onboarding_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("onboarding.onboarding_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type = Column(
        String(50), nullable=False
    )  # AADHAAR, PAN, PASSPORT, DL, EDUCATION, EXPERIENCE, RESUME, OFFER_LETTER
    status = Column(
        String(20), nullable=False, default="PENDING"
    )  # PENDING, VERIFIED, REJECTED
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    onboarding = relationship("Onboarding", back_populates="documents")

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'VERIFIED', 'REJECTED')",
            name="ck_document_verification_status",
        ),
        CheckConstraint(
            "document_type IN ('AADHAAR', 'PAN', 'PASSPORT', 'DL', 'EDUCATION', 'EXPERIENCE', 'RESUME', 'OFFER_LETTER')",
            name="ck_document_verification_type",
        ),
    )


# ---------------------------------------------------------------------------
# Background Verification — Tracks background check status
# ---------------------------------------------------------------------------

class BackgroundVerification(Base):
    __tablename__ = "background_verification"

    bgv_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    onboarding_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("onboarding.onboarding_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category = Column(
        String(50), nullable=False
    )  # REFERENCE, EMPLOYMENT, EDUCATION, CRIMINAL
    status = Column(
        String(20), nullable=False, default="PENDING"
    )  # PENDING, CLEARED, FAILED
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    onboarding = relationship("Onboarding", back_populates="background_checks")

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'CLEARED', 'FAILED')",
            name="ck_background_verification_status",
        ),
        CheckConstraint(
            "category IN ('REFERENCE', 'EMPLOYMENT', 'EDUCATION', 'CRIMINAL')",
            name="ck_background_verification_category",
        ),
    )


# ---------------------------------------------------------------------------
# Asset Allocation — Tracks IT asset allocation
# ---------------------------------------------------------------------------

class AssetAllocation(Base):
    __tablename__ = "asset_allocation"

    allocation_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    onboarding_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("onboarding.onboarding_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_type = Column(
        String(50), nullable=False
    )  # LAPTOP, MONITOR, PHONE, EMAIL, ACCESS_CARD, VPN, SOFTWARE_LICENSES
    status = Column(
        String(20), nullable=False, default="PENDING"
    )  # PENDING, ALLOCATED, CONFIGURED, RETURNED
    asset_id = Column(String(100), nullable=True)  # Physical asset ID/serial number
    allocated_by = Column(String(100), nullable=True)
    allocated_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    onboarding = relationship("Onboarding", back_populates="assets")

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'ALLOCATED', 'CONFIGURED', 'RETURNED')",
            name="ck_asset_allocation_status",
        ),
        CheckConstraint(
            "asset_type IN ('LAPTOP', 'MONITOR', 'PHONE', 'EMAIL', 'ACCESS_CARD', 'VPN', 'SOFTWARE_LICENSES')",
            name="ck_asset_allocation_type",
        ),
    )


# ---------------------------------------------------------------------------
# Employee Checklist — Tracks onboarding checklist items
# ---------------------------------------------------------------------------

class EmployeeChecklist(Base):
    __tablename__ = "employee_checklist"

    checklist_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    onboarding_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("onboarding.onboarding_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_name = Column(String(100), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_by = Column(String(100), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    onboarding = relationship("Onboarding", back_populates="checklist")

    __table_args__ = (
        CheckConstraint(
            "item_name IN ('offer_accepted', 'documents_received', 'background_complete', 'it_ready', 'payroll_ready', 'manager_assigned', 'joining_kit', 'orientation_scheduled')",
            name="ck_employee_checklist_item",
        ),
    )


# ---------------------------------------------------------------------------
# Onboarding Activity — Audit trail for onboarding actions
# ---------------------------------------------------------------------------

class OnboardingActivity(Base):
    __tablename__ = "onboarding_activity"

    activity_id = Column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    onboarding_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("onboarding.onboarding_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action = Column(String(100), nullable=False)
    performed_by = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    onboarding = relationship("Onboarding", back_populates="activities")

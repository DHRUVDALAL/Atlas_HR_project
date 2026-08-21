"""
Interview Engine — SQLAlchemy Models

Tables for the dynamic SAP Technical Interview Engine:
  - sap_domains (domain lookup)
  - experience_brackets (experience bracket lookup)
  - technical_topics (questions imported from Excel)
  - candidate_interview_assignments (HR assignment tracking)
  - interview_responses (interviewer ratings per question)
  - interview_scores (calculated scores per assignment)
  - interview_summaries (post-submission summary)
"""

import uuid
from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as pgUUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


class SapDomain(Base):
    __tablename__ = "sap_domains"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    topics = relationship("TechnicalTopic", back_populates="domain")
    assignments = relationship("CandidateInterviewAssignment", back_populates="domain_rel")


class ExperienceBracket(Base):
    __tablename__ = "experience_brackets"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)
    label = Column(String(100), nullable=False)
    min_years = Column(Float, nullable=False)
    max_years = Column(Float, nullable=True)

    topics = relationship("TechnicalTopic", back_populates="experience_bracket")
    assignments = relationship("CandidateInterviewAssignment", back_populates="experience_bracket_rel")


class TechnicalTopic(Base):
    __tablename__ = "technical_topics"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("sap_domains.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    experience_bracket_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("experience_brackets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id_code = Column(String(30), unique=True, nullable=False, index=True)
    module_code = Column(String(10), nullable=False)
    module_name = Column(String(100), nullable=False)
    topic_category = Column(String(100), nullable=False, index=True)
    question_topic = Column(Text, nullable=False)
    source = Column(String(200), nullable=True)
    difficulty = Column(String(20), nullable=True)
    weight = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    domain = relationship("SapDomain", back_populates="topics")
    experience_bracket = relationship("ExperienceBracket", back_populates="topics")
    responses = relationship("InterviewResponse", back_populates="topic")

    __table_args__ = (
        UniqueConstraint(
            "domain_id", "experience_bracket_id", "question_id_code",
            name="uq_topic_domain_bracket_qid",
        ),
    )


class CandidateInterviewAssignment(Base):
    __tablename__ = "candidate_interview_assignments"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    domain_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("sap_domains.id", ondelete="CASCADE"),
        nullable=False,
    )
    experience_bracket_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("experience_brackets.id", ondelete="CASCADE"),
        nullable=False,
    )
    assigned_interviewer = Column(String(100), nullable=False)
    assigned_by = Column(String(100), nullable=False)
    interview_round = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False, default="ACTIVE", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    domain_rel = relationship("SapDomain", back_populates="assignments")
    experience_bracket_rel = relationship("ExperienceBracket", back_populates="assignments")
    responses = relationship("InterviewResponse", back_populates="assignment", cascade="all, delete-orphan")
    score = relationship("InterviewScore", back_populates="assignment", uselist=False, cascade="all, delete-orphan")
    summary = relationship("InterviewSummary", back_populates="assignment", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint(
            "candidate_id", "interview_round",
            name="uq_assignment_candidate_round",
        ),
    )


class InterviewResponse(Base):
    __tablename__ = "interview_responses"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidate_interview_assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("technical_topics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating = Column(Integer, nullable=True)
    comment = Column(Text, nullable=True)
    rated_at = Column(DateTime(timezone=True), server_default=func.now())

    assignment = relationship("CandidateInterviewAssignment", back_populates="responses")
    topic = relationship("TechnicalTopic", back_populates="responses")

    __table_args__ = (
        UniqueConstraint(
            "assignment_id", "topic_id",
            name="uq_response_assignment_topic",
        ),
        CheckConstraint(
            "rating IS NULL OR (rating BETWEEN 1 AND 5)",
            name="ck_response_rating_range",
        ),
    )


class InterviewScore(Base):
    __tablename__ = "interview_scores"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidate_interview_assignments.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    topic_scores = Column(JSONB, nullable=True)
    overall_percentage = Column(Float, nullable=True)
    recommendation = Column(String(50), nullable=True)
    total_questions = Column(Integer, nullable=True)
    answered_questions = Column(Integer, nullable=True)
    average_rating = Column(Float, nullable=True)
    highest_topic = Column(String(200), nullable=True)
    weakest_topic = Column(String(200), nullable=True)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())

    assignment = relationship("CandidateInterviewAssignment", back_populates="score")


class InterviewSummary(Base):
    __tablename__ = "interview_summaries"

    id = Column(pgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(
        pgUUID(as_uuid=True),
        ForeignKey("candidate_interview_assignments.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    summary_json = Column(JSONB, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    assignment = relationship("CandidateInterviewAssignment", back_populates="summary")

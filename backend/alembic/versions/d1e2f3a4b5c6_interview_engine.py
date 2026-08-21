"""interview engine tables

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6g7h8
Create Date: 2026-07-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from typing import Union

revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "c3d4e5f6g7h8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # sap_domains
    op.create_table(
        "sap_domains",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(20), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
    )

    # experience_brackets
    op.create_table(
        "experience_brackets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(20), unique=True, nullable=False, index=True),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("min_years", sa.Float, nullable=False),
        sa.Column("max_years", sa.Float, nullable=True),
    )

    # technical_topics
    op.create_table(
        "technical_topics",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("domain_id", UUID(as_uuid=True), sa.ForeignKey("sap_domains.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("experience_bracket_id", UUID(as_uuid=True), sa.ForeignKey("experience_brackets.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("question_id_code", sa.String(30), unique=True, nullable=False, index=True),
        sa.Column("module_code", sa.String(10), nullable=False),
        sa.Column("module_name", sa.String(100), nullable=False),
        sa.Column("topic_category", sa.String(100), nullable=False, index=True),
        sa.Column("question_topic", sa.Text, nullable=False),
        sa.Column("source", sa.String(200), nullable=True),
        sa.Column("difficulty", sa.String(20), nullable=True),
        sa.Column("weight", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("domain_id", "experience_bracket_id", "question_id_code", name="uq_topic_domain_bracket_qid"),
    )

    # candidate_interview_assignments
    op.create_table(
        "candidate_interview_assignments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("candidate_id", UUID(as_uuid=True), sa.ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("domain_id", UUID(as_uuid=True), sa.ForeignKey("sap_domains.id", ondelete="CASCADE"), nullable=False),
        sa.Column("experience_bracket_id", UUID(as_uuid=True), sa.ForeignKey("experience_brackets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assigned_interviewer", sa.String(100), nullable=False),
        sa.Column("assigned_by", sa.String(100), nullable=False),
        sa.Column("interview_round", sa.Integer, nullable=False, server_default="1"),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("candidate_id", "interview_round", name="uq_assignment_candidate_round"),
    )

    # interview_responses
    op.create_table(
        "interview_responses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("assignment_id", UUID(as_uuid=True), sa.ForeignKey("candidate_interview_assignments.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("topic_id", UUID(as_uuid=True), sa.ForeignKey("technical_topics.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("rating", sa.Integer, nullable=True),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("rated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("assignment_id", "topic_id", name="uq_response_assignment_topic"),
        sa.CheckConstraint("rating IS NULL OR (rating BETWEEN 1 AND 5)", name="ck_response_rating_range"),
    )

    # interview_scores
    op.create_table(
        "interview_scores",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("assignment_id", UUID(as_uuid=True), sa.ForeignKey("candidate_interview_assignments.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("topic_scores", JSONB, nullable=True),
        sa.Column("overall_percentage", sa.Float, nullable=True),
        sa.Column("recommendation", sa.String(50), nullable=True),
        sa.Column("total_questions", sa.Integer, nullable=True),
        sa.Column("answered_questions", sa.Integer, nullable=True),
        sa.Column("average_rating", sa.Float, nullable=True),
        sa.Column("highest_topic", sa.String(200), nullable=True),
        sa.Column("weakest_topic", sa.String(200), nullable=True),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # interview_summaries
    op.create_table(
        "interview_summaries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("assignment_id", UUID(as_uuid=True), sa.ForeignKey("candidate_interview_assignments.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("summary_json", JSONB, nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("interview_summaries")
    op.drop_table("interview_scores")
    op.drop_table("interview_responses")
    op.drop_table("candidate_interview_assignments")
    op.drop_table("technical_topics")
    op.drop_table("experience_brackets")
    op.drop_table("sap_domains")

"""add applied_from and source_name to candidates

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-07-18 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6g7h8'
down_revision: Union[str, None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('candidates', sa.Column('applied_from', sa.String(length=20), nullable=True))
    op.add_column('candidates', sa.Column('source_name', sa.String(length=100), nullable=True))
    op.create_check_constraint(
        'ck_applied_from_valid',
        'candidates',
        "applied_from IS NULL OR applied_from IN ('LINKEDIN', 'NAUKRI', 'VENDOR', 'REFERRAL')",
    )


def downgrade() -> None:
    op.drop_check_constraint('ck_applied_from_valid', 'candidates')
    op.drop_column('candidates', 'source_name')
    op.drop_column('candidates', 'applied_from')

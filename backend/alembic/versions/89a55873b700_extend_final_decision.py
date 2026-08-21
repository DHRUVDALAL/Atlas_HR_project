"""extend final decision

Revision ID: 89a55873b700
Revises: ef61d7e4207d
Create Date: 2026-07-10 11:15:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '89a55873b700'
down_revision: Union[str, None] = 'ef61d7e4207d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('final_decisions', sa.Column('hr_discussion', sa.Text(), nullable=True))
    op.add_column('final_decisions', sa.Column('ceo_discussion', sa.Text(), nullable=True))
    op.add_column('final_decisions', sa.Column('created_by', sa.String(length=100), nullable=True))
    op.add_column('final_decisions', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.add_column('final_decisions', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.alter_column('final_decisions', 'approved_by', existing_type=sa.String(length=100), nullable=True)


def downgrade() -> None:
    op.alter_column('final_decisions', 'approved_by', existing_type=sa.String(length=100), nullable=False)
    op.drop_column('final_decisions', 'updated_at')
    op.drop_column('final_decisions', 'created_at')
    op.drop_column('final_decisions', 'created_by')
    op.drop_column('final_decisions', 'ceo_discussion')
    op.drop_column('final_decisions', 'hr_discussion')

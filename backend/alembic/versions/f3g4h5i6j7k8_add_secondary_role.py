"""add secondary role

Revision ID: f3g4h5i6j7k8
Revises: 3a602c1ad344
Create Date: 2026-08-31 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f3g4h5i6j7k8'
down_revision = '3a602c1ad344'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('secondary_role_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, 'users', 'roles', ['secondary_role_id'], ['role_id'])


def downgrade():
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_column('users', 'secondary_role_id')

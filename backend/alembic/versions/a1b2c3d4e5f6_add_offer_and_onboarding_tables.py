"""add offer and onboarding tables

Revision ID: a1b2c3d4e5f6
Revises: 89a55873b700
Create Date: 2026-07-13 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '89a55873b700'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === OFFER MANAGEMENT TABLES ===

    # offers table
    op.create_table('offers',
        sa.Column('offer_id', sa.UUID(), nullable=False),
        sa.Column('candidate_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='DRAFT'),
        sa.Column('offered_ctc', sa.Numeric(12, 2), nullable=True),
        sa.Column('joining_date', sa.Date(), nullable=True),
        sa.Column('approved_by', sa.String(length=100), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('offer_id'),
        sa.UniqueConstraint('candidate_id'),
        sa.CheckConstraint("status IN ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED')", name='ck_offers_status'),
        sa.CheckConstraint('offered_ctc IS NULL OR offered_ctc > 0', name='ck_offered_ctc_positive'),
    )
    op.create_index(op.f('ix_offers_offer_id'), 'offers', ['offer_id'], unique=False)
    op.create_index(op.f('ix_offers_status'), 'offers', ['status'], unique=False)
    op.create_foreign_key('fk_offers_candidate', 'offers', 'candidates', ['candidate_id'], ['candidate_id'], ondelete='CASCADE')

    # offer_documents table
    op.create_table('offer_documents',
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('offer_id', sa.UUID(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('uploaded_by', sa.String(length=100), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('document_id'),
        sa.CheckConstraint("document_type IN ('OFFER_LETTER', 'SIGNED_OFFER', 'ADDENDUM', 'OTHER')", name='ck_offer_documents_type'),
    )
    op.create_index(op.f('ix_offer_documents_document_id'), 'offer_documents', ['document_id'], unique=False)
    op.create_index(op.f('ix_offer_documents_offer_id'), 'offer_documents', ['offer_id'], unique=False)
    op.create_foreign_key('fk_offer_documents_offer', 'offer_documents', 'offers', ['offer_id'], ['offer_id'], ondelete='CASCADE')

    # offer_history table
    op.create_table('offer_history',
        sa.Column('history_id', sa.UUID(), nullable=False),
        sa.Column('offer_id', sa.UUID(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('performed_by', sa.String(length=100), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('history_id'),
    )
    op.create_index(op.f('ix_offer_history_history_id'), 'offer_history', ['history_id'], unique=False)
    op.create_index(op.f('ix_offer_history_offer_id'), 'offer_history', ['offer_id'], unique=False)
    op.create_foreign_key('fk_offer_history_offer', 'offer_history', 'offers', ['offer_id'], ['offer_id'], ondelete='CASCADE')

    # === ONBOARDING TABLES ===

    # onboarding table
    op.create_table('onboarding',
        sa.Column('onboarding_id', sa.UUID(), nullable=False),
        sa.Column('candidate_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('onboarding_id'),
        sa.UniqueConstraint('candidate_id'),
        sa.CheckConstraint("status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')", name='ck_onboarding_status'),
    )
    op.create_index(op.f('ix_onboarding_onboarding_id'), 'onboarding', ['onboarding_id'], unique=False)
    op.create_index(op.f('ix_onboarding_status'), 'onboarding', ['status'], unique=False)
    op.create_foreign_key('fk_onboarding_candidate', 'onboarding', 'candidates', ['candidate_id'], ['candidate_id'], ondelete='CASCADE')

    # document_verification table
    op.create_table('document_verification',
        sa.Column('verification_id', sa.UUID(), nullable=False),
        sa.Column('onboarding_id', sa.UUID(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('verified_by', sa.String(length=100), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('verification_id'),
        sa.UniqueConstraint('onboarding_id', 'document_type', name='uq_document_verification_type'),
        sa.CheckConstraint("status IN ('PENDING', 'VERIFIED', 'REJECTED')", name='ck_document_verification_status'),
        sa.CheckConstraint("document_type IN ('AADHAAR', 'PAN', 'PASSPORT', 'DL', 'EDUCATION', 'EXPERIENCE', 'RESUME', 'OFFER_LETTER')", name='ck_document_verification_type'),
    )
    op.create_index(op.f('ix_document_verification_verification_id'), 'document_verification', ['verification_id'], unique=False)
    op.create_index(op.f('ix_document_verification_onboarding_id'), 'document_verification', ['onboarding_id'], unique=False)
    op.create_foreign_key('fk_document_verification_onboarding', 'document_verification', 'onboarding', ['onboarding_id'], ['onboarding_id'], ondelete='CASCADE')

    # background_verification table
    op.create_table('background_verification',
        sa.Column('bgv_id', sa.UUID(), nullable=False),
        sa.Column('onboarding_id', sa.UUID(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('verified_by', sa.String(length=100), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('bgv_id'),
        sa.UniqueConstraint('onboarding_id', 'category', name='uq_background_verification_category'),
        sa.CheckConstraint("status IN ('PENDING', 'CLEARED', 'FAILED')", name='ck_background_verification_status'),
        sa.CheckConstraint("category IN ('REFERENCE', 'EMPLOYMENT', 'EDUCATION', 'CRIMINAL')", name='ck_background_verification_category'),
    )
    op.create_index(op.f('ix_background_verification_bgv_id'), 'background_verification', ['bgv_id'], unique=False)
    op.create_index(op.f('ix_background_verification_onboarding_id'), 'background_verification', ['onboarding_id'], unique=False)
    op.create_foreign_key('fk_background_verification_onboarding', 'background_verification', 'onboarding', ['onboarding_id'], ['onboarding_id'], ondelete='CASCADE')

    # asset_allocation table
    op.create_table('asset_allocation',
        sa.Column('allocation_id', sa.UUID(), nullable=False),
        sa.Column('onboarding_id', sa.UUID(), nullable=False),
        sa.Column('asset_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('asset_id', sa.String(length=100), nullable=True),
        sa.Column('allocated_by', sa.String(length=100), nullable=True),
        sa.Column('allocated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('allocation_id'),
        sa.UniqueConstraint('onboarding_id', 'asset_type', name='uq_asset_allocation_type'),
        sa.CheckConstraint("status IN ('PENDING', 'ALLOCATED', 'CONFIGURED', 'RETURNED')", name='ck_asset_allocation_status'),
        sa.CheckConstraint("asset_type IN ('LAPTOP', 'MONITOR', 'PHONE', 'EMAIL', 'ACCESS_CARD', 'VPN', 'SOFTWARE_LICENSES')", name='ck_asset_allocation_type'),
    )
    op.create_index(op.f('ix_asset_allocation_allocation_id'), 'asset_allocation', ['allocation_id'], unique=False)
    op.create_index(op.f('ix_asset_allocation_onboarding_id'), 'asset_allocation', ['onboarding_id'], unique=False)
    op.create_foreign_key('fk_asset_allocation_onboarding', 'asset_allocation', 'onboarding', ['onboarding_id'], ['onboarding_id'], ondelete='CASCADE')

    # employee_checklist table
    op.create_table('employee_checklist',
        sa.Column('checklist_id', sa.UUID(), nullable=False),
        sa.Column('onboarding_id', sa.UUID(), nullable=False),
        sa.Column('item_name', sa.String(length=100), nullable=False),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('completed_by', sa.String(length=100), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('checklist_id'),
        sa.UniqueConstraint('onboarding_id', 'item_name', name='uq_employee_checklist_item'),
        sa.CheckConstraint("item_name IN ('offer_accepted', 'documents_received', 'background_complete', 'it_ready', 'payroll_ready', 'manager_assigned', 'joining_kit', 'orientation_scheduled')", name='ck_employee_checklist_item'),
    )
    op.create_index(op.f('ix_employee_checklist_checklist_id'), 'employee_checklist', ['checklist_id'], unique=False)
    op.create_index(op.f('ix_employee_checklist_onboarding_id'), 'employee_checklist', ['onboarding_id'], unique=False)
    op.create_foreign_key('fk_employee_checklist_onboarding', 'employee_checklist', 'onboarding', ['onboarding_id'], ['onboarding_id'], ondelete='CASCADE')

    # onboarding_activity table
    op.create_table('onboarding_activity',
        sa.Column('activity_id', sa.UUID(), nullable=False),
        sa.Column('onboarding_id', sa.UUID(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('performed_by', sa.String(length=100), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('activity_id'),
    )
    op.create_index(op.f('ix_onboarding_activity_activity_id'), 'onboarding_activity', ['activity_id'], unique=False)
    op.create_index(op.f('ix_onboarding_activity_onboarding_id'), 'onboarding_activity', ['onboarding_id'], unique=False)
    op.create_foreign_key('fk_onboarding_activity_onboarding', 'onboarding_activity', 'onboarding', ['onboarding_id'], ['onboarding_id'], ondelete='CASCADE')

    # === NEW PERMISSIONS ===
    op.execute("""
        INSERT INTO permissions (permission_id, code, description) VALUES
            (gen_random_uuid(), 'offer.create', 'Create offer for candidate'),
            (gen_random_uuid(), 'offer.view', 'View offer details'),
            (gen_random_uuid(), 'offer.update', 'Update offer details'),
            (gen_random_uuid(), 'offer.send', 'Send offer letter to candidate'),
            (gen_random_uuid(), 'offer.approve', 'Approve/accept offer'),
            (gen_random_uuid(), 'offer.decline', 'Decline offer'),
            (gen_random_uuid(), 'offer.delete', 'Delete an offer'),
            (gen_random_uuid(), 'onboarding.manage', 'Manage onboarding process'),
            (gen_random_uuid(), 'onboarding.view', 'View onboarding details'),
            (gen_random_uuid(), 'onboarding.verify', 'Verify documents and background checks'),
            (gen_random_uuid(), 'onboarding.allocate', 'Allocate IT assets')
        ON CONFLICT (code) DO NOTHING;
    """)

    # === ROLE-PERMISSION MAPPINGS ===
    # HR_ADMIN
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'HR_ADMIN'
        AND p.code IN ('offer.create', 'offer.view', 'offer.update', 'offer.send', 'offer.delete',
                       'onboarding.manage', 'onboarding.view', 'onboarding.verify', 'onboarding.allocate')
        ON CONFLICT DO NOTHING;
    """)

    # CEO
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'CEO'
        AND p.code IN ('offer.view', 'offer.approve', 'onboarding.view')
        ON CONFLICT DO NOTHING;
    """)

    # TECH_HEAD
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'TECH_HEAD'
        AND p.code IN ('offer.view', 'onboarding.view')
        ON CONFLICT DO NOTHING;
    """)

    # HR_PANEL
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'HR_PANEL'
        AND p.code IN ('offer.view', 'onboarding.view')
        ON CONFLICT DO NOTHING;
    """)

    # SYSTEM_ADMIN already has all permissions via PERMISSIONS.keys()


def downgrade() -> None:
    # Remove role-permission mappings
    op.execute("""
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT permission_id FROM permissions
            WHERE code IN ('offer.create', 'offer.view', 'offer.update', 'offer.send',
                          'offer.approve', 'offer.decline', 'offer.delete',
                          'onboarding.manage', 'onboarding.view', 'onboarding.verify', 'onboarding.allocate')
        );
    """)

    # Remove permissions
    op.execute("""
        DELETE FROM permissions
        WHERE code IN ('offer.create', 'offer.view', 'offer.update', 'offer.send',
                      'offer.approve', 'offer.decline', 'offer.delete',
                      'onboarding.manage', 'onboarding.view', 'onboarding.verify', 'onboarding.allocate');
    """)

    # Drop tables in reverse order
    op.drop_table('onboarding_activity')
    op.drop_table('employee_checklist')
    op.drop_table('asset_allocation')
    op.drop_table('background_verification')
    op.drop_table('document_verification')
    op.drop_table('onboarding')
    op.drop_table('offer_history')
    op.drop_table('offer_documents')
    op.drop_table('offers')

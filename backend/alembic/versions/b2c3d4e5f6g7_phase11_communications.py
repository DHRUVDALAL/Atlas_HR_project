"""phase 11 communications and automation

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-14 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Email Templates
    op.create_table(
        'email_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('code', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('body_html', sa.Text(), nullable=False),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('category', sa.String(50), nullable=False, server_default='general'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('variables', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Email History
    op.create_table(
        'email_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('template_code', sa.String(100), nullable=True),
        sa.Column('recipient_email', sa.String(255), nullable=False, index=True),
        sa.Column('recipient_name', sa.String(255), nullable=True),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending', index=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_retries', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('meta', postgresql.JSONB(), nullable=True),
    )
    op.create_index('ix_email_history_status_created', 'email_history', ['status', 'created_at'])

    # Email Queue
    op.create_table(
        'email_queue',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('history_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('email_history.id'), nullable=False, index=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('locked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('locked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('locked_by', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_email_queue_scheduled_locked', 'email_queue', ['scheduled_at', 'locked'])

    # Notifications
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False, index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(50), nullable=False, server_default='info', index=True),
        sa.Column('category', sa.String(50), nullable=False, server_default='system', index=True),
        sa.Column('priority', sa.String(20), nullable=False, server_default='normal'),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false', index=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('action_url', sa.String(500), nullable=True),
        sa.Column('meta', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_notifications_user_unread', 'notifications', ['user_id', 'is_read'])

    # Activity Logs
    op.create_table(
        'activity_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=True, index=True),
        sa.Column('user_email', sa.String(255), nullable=True),
        sa.Column('action', sa.String(100), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=True, index=True),
        sa.Column('entity_id', sa.String(100), nullable=True, index=True),
        sa.Column('entity_label', sa.String(255), nullable=True),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_activity_logs_action_created', 'activity_logs', ['action', 'created_at'])
    op.create_index('ix_activity_logs_entity', 'activity_logs', ['entity_type', 'entity_id'])

    # Document Storage
    op.create_table(
        'document_storage',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('candidate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('candidates.candidate_id'), nullable=True, index=True),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=True),
        sa.Column('document_type', sa.String(50), nullable=False, index=True),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('original_name', sa.String(255), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_latest', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('meta', postgresql.JSONB(), nullable=True),
        sa.Column('checksum', sa.String(64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_document_storage_candidate_type', 'document_storage', ['candidate_id', 'document_type'])

    # Saved Searches
    op.create_table(
        'saved_searches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('search_type', sa.String(50), nullable=False),
        sa.Column('filters', postgresql.JSONB(), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('use_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # New permissions for Phase 11
    new_permissions = [
        ('email.send', 'Send emails'),
        ('email.view', 'View email history'),
        ('email.admin', 'Administer email system'),
        ('notification.view', 'View notifications'),
        ('notification.manage', 'Manage notifications'),
        ('activity.view', 'View activity logs'),
        ('document.upload', 'Upload documents'),
        ('document.view', 'View documents'),
        ('document.download', 'Download documents'),
        ('document.delete', 'Delete documents'),
        ('bgv.view', 'View background verification'),
        ('bgv.verify', 'Run background verification'),
        ('scheduler.admin', 'Administer scheduler'),
        ('search.view', 'Use search functionality'),
        ('report.export', 'Export reports'),
        ('dashboard.view', 'View dashboard alerts'),
    ]

    for code, desc in new_permissions:
        op.execute(
            f"INSERT INTO permissions (permission_id, code, description) "
            f"VALUES (gen_random_uuid(), '{code}', '{desc}') "
            f"ON CONFLICT (code) DO NOTHING"
        )

    # Map permissions to roles
    role_permission_map = {
        'SYSTEM_ADMIN': [p[0] for p in new_permissions],
        'HR_ADMIN': [
            'email.send', 'email.view', 'email.admin',
            'notification.view', 'notification.manage',
            'activity.view', 'document.upload', 'document.view',
            'document.download', 'document.delete',
            'bgv.view', 'bgv.verify', 'scheduler.admin',
            'search.view', 'report.export', 'dashboard.view',
        ],
        'HR_PANEL': [
            'email.view', 'notification.view', 'activity.view',
            'document.view', 'document.upload', 'search.view',
            'report.export', 'dashboard.view',
        ],
        'CEO': [
            'email.view', 'notification.view', 'activity.view',
            'document.view', 'search.view', 'report.export', 'dashboard.view',
        ],
        'TECH_HEAD': [
            'email.view', 'notification.view', 'document.view',
            'search.view', 'dashboard.view',
        ],
    }

    for role_name, perm_codes in role_permission_map.items():
        for code in perm_codes:
            op.execute(
                f"INSERT INTO role_permissions (role_id, permission_id) "
                f"SELECT r.role_id, p.permission_id FROM roles r, permissions p "
                f"WHERE r.role_name = '{role_name}' AND p.code = '{code}' "
                f"AND NOT EXISTS ("
                f"  SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.role_id AND rp.permission_id = p.permission_id"
                f")"
            )


def downgrade() -> None:
    op.drop_table('saved_searches')
    op.drop_table('document_storage')
    op.drop_table('activity_logs')
    op.drop_table('notifications')
    op.drop_table('email_queue')
    op.drop_table('email_history')
    op.drop_table('email_templates')

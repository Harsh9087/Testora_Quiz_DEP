"""add coupon_campaigns, coupons, and system_settings tables

Revision ID: d79f2b6c8e9f
Revises: c68e1a5b7d8e
Create Date: 2026-10-27 19:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

# revision identifiers, used by Alembic.
revision: str = 'd79f2b6c8e9f'
down_revision: Union[str, None] = 'c68e1a5b7d8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. coupon_campaigns table
    if 'coupon_campaigns' not in existing_tables:
        op.create_table(
            'coupon_campaigns',
            sa.Column('id', sa.String(36), primary_key=True, index=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), default=False, nullable=False),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('code_prefix', sa.String(50), default="TESTORA-", nullable=False),
            sa.Column('credits_per_coupon', sa.Integer(), nullable=False),
            sa.Column('credit_type', sa.String(20), default="PAID", nullable=False),
            sa.Column('bonus_expiry_days', sa.Integer(), default=30, nullable=True),
            sa.Column('total_coupons', sa.Integer(), default=0, nullable=False),
            sa.Column('redeemed_count', sa.Integer(), default=0, nullable=False),
            sa.Column('revoked_count', sa.Integer(), default=0, nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
            sa.Column('allowed_roles', sa.String(100), default="teacher", nullable=False),
            sa.Column('max_redemptions_per_user', sa.Integer(), default=1, nullable=False),
            sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        )

    # 2. coupons table
    if 'coupons' not in existing_tables:
        op.create_table(
            'coupons',
            sa.Column('id', sa.String(36), primary_key=True, index=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), default=False, nullable=False),
            sa.Column('campaign_id', sa.String(36), sa.ForeignKey('coupon_campaigns.id'), nullable=False, index=True),
            sa.Column('code', sa.String(100), unique=True, index=True, nullable=False),
            sa.Column('credits', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(20), default="UNUSED", index=True, nullable=False),
            sa.Column('redeemed_by_user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True, index=True),
            sa.Column('redeemed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('revoked_by', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
            sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('revoked_reason', sa.String(255), nullable=True),
        )

    # 3. system_settings table
    if 'system_settings' not in existing_tables:
        op.create_table(
            'system_settings',
            sa.Column('id', sa.String(36), primary_key=True, index=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), default=False, nullable=False),
            sa.Column('key', sa.String(100), unique=True, index=True, nullable=False),
            sa.Column('value', sa.Text(), nullable=False),
            sa.Column('description', sa.String(255), nullable=True),
            sa.Column('value_type', sa.String(20), default="string", nullable=False),
        )

        # Seed initial system settings for signup bonus
        settings_tbl = table(
            'system_settings',
            column('id', sa.String),
            column('created_at', sa.DateTime),
            column('updated_at', sa.DateTime),
            column('is_deleted', sa.Boolean),
            column('key', sa.String),
            column('value', sa.Text),
            column('description', sa.String),
            column('value_type', sa.String)
        )
        import uuid
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        op.bulk_insert(
            settings_tbl,
            [
                {
                    'id': str(uuid.uuid4()),
                    'created_at': now,
                    'updated_at': now,
                    'is_deleted': False,
                    'key': 'signup_bonus_credits',
                    'value': '200',
                    'description': 'Default bonus credits granted upon new teacher registration',
                    'value_type': 'int'
                },
                {
                    'id': str(uuid.uuid4()),
                    'created_at': now,
                    'updated_at': now,
                    'is_deleted': False,
                    'key': 'signup_bonus_validity_days',
                    'value': '15',
                    'description': 'Validity in days for promotional signup bonus credits',
                    'value_type': 'int'
                }
            ]
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'coupons' in existing_tables:
        op.drop_table('coupons')
    if 'coupon_campaigns' in existing_tables:
        op.drop_table('coupon_campaigns')
    if 'system_settings' in existing_tables:
        op.drop_table('system_settings')

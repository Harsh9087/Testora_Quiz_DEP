"""add bonus_credits and bonus_credits_expires_at to users

Revision ID: c68e1a5b7d8e
Revises: b57f3a4b6c7d
Create Date: 2026-10-27 14:07:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c68e1a5b7d8e'
down_revision: Union[str, None] = 'b57f3a4b6c7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('users')]
    
    if 'bonus_credits' not in existing_cols:
        op.add_column('users', sa.Column('bonus_credits', sa.Integer(), nullable=False, server_default='500'))
    if 'bonus_credits_expires_at' not in existing_cols:
        op.add_column('users', sa.Column('bonus_credits_expires_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('users')]
    
    if 'bonus_credits_expires_at' in existing_cols:
        op.drop_column('users', 'bonus_credits_expires_at')
    if 'bonus_credits' in existing_cols:
        op.drop_column('users', 'bonus_credits')

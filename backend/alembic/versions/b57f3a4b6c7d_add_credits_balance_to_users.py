"""add credits_balance to users

Revision ID: b57f3a4b6c7d
Revises: a46e2f3a5b6c
Create Date: 2026-10-24 13:06:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b57f3a4b6c7d'
down_revision: Union[str, None] = 'a46e2f3a5b6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('users')]
    
    if 'credits_balance' not in existing_cols:
        op.add_column('users', sa.Column('credits_balance', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('users')]
    
    if 'credits_balance' in existing_cols:
        op.drop_column('users', 'credits_balance')

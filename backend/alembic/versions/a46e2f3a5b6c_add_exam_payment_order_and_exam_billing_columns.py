"""add_exam_payment_order_and_exam_billing_columns

Revision ID: a46e2f3a5b6c
Revises: 935d1e2f4a5b
Create Date: 2026-10-24 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a46e2f3a5b6c'
down_revision: Union[str, Sequence[str], None] = '935d1e2f4a5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    is_pg = (conn.dialect.name == "postgresql")
    bool_server_default_false = sa.text("false") if is_pg else sa.text("0")
    int_server_default_zero = sa.text("0")

    # 1. Update exams table with payment columns
    if 'exams' in existing_tables:
        exam_cols = [c['name'] for c in inspector.get_columns('exams')]
        if 'is_paid' not in exam_cols:
            op.add_column('exams', sa.Column('is_paid', sa.Boolean(), server_default=bool_server_default_false, nullable=False))
        if 'paid_student_count' not in exam_cols:
            op.add_column('exams', sa.Column('paid_student_count', sa.Integer(), server_default=int_server_default_zero, nullable=False))
        if 'paid_question_count' not in exam_cols:
            op.add_column('exams', sa.Column('paid_question_count', sa.Integer(), server_default=int_server_default_zero, nullable=False))
        if 'paid_amount_paise' not in exam_cols:
            op.add_column('exams', sa.Column('paid_amount_paise', sa.Integer(), server_default=int_server_default_zero, nullable=False))

    # 2. Ensure payment_orders table exists
    if 'payment_orders' not in existing_tables:
        op.create_table(
            'payment_orders',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('institution_id', sa.String(36), sa.ForeignKey('institutions.id'), nullable=True, index=True),
            sa.Column('exam_id', sa.String(36), sa.ForeignKey('exams.id'), nullable=True, index=True),
            sa.Column('order_type', sa.String(50), server_default='EXAM_PAYMENT', nullable=False),
            sa.Column('plan_id', sa.String(50), nullable=True),
            sa.Column('student_count', sa.Integer(), server_default=int_server_default_zero, nullable=False),
            sa.Column('question_count', sa.Integer(), server_default=int_server_default_zero, nullable=False),
            sa.Column('rate_per_unit_paise', sa.Integer(), server_default='10', nullable=False),
            sa.Column('billable_units', sa.Integer(), server_default=int_server_default_zero, nullable=False),
            sa.Column('credits_added', sa.Integer(), server_default=int_server_default_zero, nullable=False),
            sa.Column('amount', sa.Integer(), nullable=False),
            sa.Column('subtotal_amount', sa.Integer(), server_default=int_server_default_zero, nullable=False),
            sa.Column('tax_amount', sa.Integer(), server_default=int_server_default_zero, nullable=False),
            sa.Column('currency', sa.String(10), server_default='INR', nullable=False),
            sa.Column('razorpay_order_id', sa.String(100), unique=True, nullable=False, index=True),
            sa.Column('razorpay_payment_id', sa.String(100), nullable=True, index=True),
            sa.Column('razorpay_signature', sa.String(255), nullable=True),
            sa.Column('status', sa.String(50), server_default='created', nullable=False),
            sa.Column('receipt', sa.String(100), nullable=True),
            sa.Column('invoice_number', sa.String(100), unique=True, nullable=True, index=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
        )
    else:
        # Check if new columns need to be added to payment_orders
        p_cols = [c['name'] for c in inspector.get_columns('payment_orders')]
        if 'student_count' not in p_cols:
            op.add_column('payment_orders', sa.Column('student_count', sa.Integer(), server_default=int_server_default_zero, nullable=False))
        if 'question_count' not in p_cols:
            op.add_column('payment_orders', sa.Column('question_count', sa.Integer(), server_default=int_server_default_zero, nullable=False))
        if 'rate_per_unit_paise' not in p_cols:
            op.add_column('payment_orders', sa.Column('rate_per_unit_paise', sa.Integer(), server_default='10', nullable=False))
        if 'billable_units' not in p_cols:
            op.add_column('payment_orders', sa.Column('billable_units', sa.Integer(), server_default=int_server_default_zero, nullable=False))
        if 'subtotal_amount' not in p_cols:
            op.add_column('payment_orders', sa.Column('subtotal_amount', sa.Integer(), server_default=int_server_default_zero, nullable=False))
        if 'tax_amount' not in p_cols:
            op.add_column('payment_orders', sa.Column('tax_amount', sa.Integer(), server_default=int_server_default_zero, nullable=False))
        if 'exam_id' not in p_cols:
            op.add_column('payment_orders', sa.Column('exam_id', sa.String(36), nullable=True))
        if 'invoice_number' not in p_cols:
            op.add_column('payment_orders', sa.Column('invoice_number', sa.String(100), nullable=True))

    # 3. Ensure credit_transactions table exists
    if 'credit_transactions' not in existing_tables:
        op.create_table(
            'credit_transactions',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
            sa.Column('exam_id', sa.String(36), sa.ForeignKey('exams.id'), nullable=True, index=True),
            sa.Column('payment_order_id', sa.String(36), sa.ForeignKey('payment_orders.id'), nullable=True, index=True),
            sa.Column('transaction_type', sa.String(50), nullable=False),
            sa.Column('amount_credits', sa.Integer(), nullable=False),
            sa.Column('balance_after', sa.Integer(), nullable=False),
            sa.Column('description', sa.String(255), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
        )

def downgrade() -> None:
    pass

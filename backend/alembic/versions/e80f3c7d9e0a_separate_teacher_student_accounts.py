"""separate teacher student accounts and shared test records

Revision ID: e80f3c7d9e0a
Revises: d79f2b6c8e9f
Create Date: 2026-10-30 15:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e80f3c7d9e0a'
down_revision: Union[str, None] = 'd79f2b6c8e9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    is_pg = (conn.dialect.name == "postgresql")

    # 1. Modify users table indexes for role-scoped uniqueness
    try:
        op.drop_index('ix_users_email', table_name='users')
    except Exception:
        pass

    try:
        op.drop_index('ix_users_google_subject', table_name='users')
    except Exception:
        pass

    # Create composite unique index (email, role)
    try:
        op.create_index('ix_users_email_role', 'users', ['email', 'role'], unique=True)
    except Exception:
        pass

    # Create composite unique index (google_subject, role)
    try:
        op.create_index('ix_users_google_subject_role', 'users', ['google_subject', 'role'], unique=True)
    except Exception:
        pass

    # Fast non-unique email lookup
    try:
        op.create_index('ix_users_email', 'users', ['email'], unique=False)
    except Exception:
        pass

    # 2. Add new profile fields to users table
    users_cols = [c['name'] for c in inspector.get_columns('users')]
    new_user_cols = [
        ('institution_name', sa.String(255)),
        ('department', sa.String(255)),
        ('class_name', sa.String(100)),
        ('section', sa.String(50)),
        ('batch', sa.String(100)),
        ('phone', sa.String(50)),
    ]
    for col_name, col_type in new_user_cols:
        if col_name not in users_cols:
            op.add_column('users', sa.Column(col_name, col_type, nullable=True))

    # 3. Add snapshot and historical conducting fields to exams table
    exams_cols = [c['name'] for c in inspector.get_columns('exams')]
    new_exam_cols = [
        ('teacher_name_snapshot', sa.String(255)),
        ('teacher_email_snapshot', sa.String(255)),
        ('institution_name', sa.String(255)),
        ('class_name', sa.String(100)),
        ('section', sa.String(50)),
        ('batch', sa.String(100)),
        ('subject_name_snapshot', sa.String(255)),
    ]
    for col_name, col_type in new_exam_cols:
        if col_name not in exams_cols:
            op.add_column('exams', sa.Column(col_name, col_type, nullable=True))

    # 4. Add student identity fields to exam_submissions
    sub_cols = [c['name'] for c in inspector.get_columns('exam_submissions')]
    if 'student_user_id' not in sub_cols:
        op.add_column('exam_submissions', sa.Column('student_user_id', sa.String(36), nullable=True))
        try:
            op.create_index('ix_exam_submissions_student_user_id', 'exam_submissions', ['student_user_id'], unique=False)
        except Exception:
            pass

    if 'student_id' not in sub_cols:
        op.add_column('exam_submissions', sa.Column('student_id', sa.String(36), nullable=True))
        try:
            op.create_index('ix_exam_submissions_student_id', 'exam_submissions', ['student_id'], unique=False)
        except Exception:
            pass

    # 5. Data backfill for existing records
    conn.execute(sa.text("""
        UPDATE exams 
        SET teacher_name_snapshot = (SELECT full_name FROM users WHERE users.id = exams.created_by) 
        WHERE teacher_name_snapshot IS NULL AND created_by IS NOT NULL;
    """))
    conn.execute(sa.text("""
        UPDATE exams 
        SET teacher_email_snapshot = (SELECT email FROM users WHERE users.id = exams.created_by) 
        WHERE teacher_email_snapshot IS NULL AND created_by IS NOT NULL;
    """))
    conn.execute(sa.text("""
        UPDATE exams 
        SET subject_name_snapshot = (SELECT name FROM subjects WHERE subjects.id = exams.subject_id) 
        WHERE subject_name_snapshot IS NULL AND subject_id IS NOT NULL;
    """))
    conn.execute(sa.text("""
        UPDATE exam_submissions 
        SET student_id = (SELECT student_id FROM exam_credentials WHERE exam_credentials.id = exam_submissions.credential_id) 
        WHERE student_id IS NULL;
    """))
    conn.execute(sa.text("""
        UPDATE exam_submissions 
        SET student_user_id = (SELECT user_id FROM students WHERE students.id = exam_submissions.student_id) 
        WHERE student_user_id IS NULL AND student_id IS NOT NULL;
    """))


def downgrade() -> None:
    pass

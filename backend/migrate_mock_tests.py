import sqlite3

def run_migration():
    conn = sqlite3.connect('backend/quiz.db')
    cur = conn.cursor()

    def add_col_if_missing(table, col, col_type):
        cols = [c[1] for c in cur.execute(f"PRAGMA table_info({table})").fetchall()]
        if col not in cols:
            print(f"Adding {col} to {table}...")
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")

    # mock_tests additions
    add_col_if_missing('mock_tests', 'is_platform_library', 'BOOLEAN DEFAULT 1')
    add_col_if_missing('mock_tests', 'creator_role', "VARCHAR(50) DEFAULT 'super_admin'")
    add_col_if_missing('mock_tests', 'share_token', 'VARCHAR(64)')
    add_col_if_missing('mock_tests', 'share_access_type', "VARCHAR(50) DEFAULT 'assigned_only'")
    add_col_if_missing('mock_tests', 'login_required', 'BOOLEAN DEFAULT 1')
    add_col_if_missing('mock_tests', 'is_link_active', 'BOOLEAN DEFAULT 1')
    add_col_if_missing('mock_tests', 'start_time', 'VARCHAR(50)')
    add_col_if_missing('mock_tests', 'end_time', 'VARCHAR(50)')
    add_col_if_missing('mock_tests', 'results_visibility', "VARCHAR(50) DEFAULT 'immediate'")
    add_col_if_missing('mock_tests', 'are_results_released', 'BOOLEAN DEFAULT 1')
    add_col_if_missing('mock_tests', 'assigned_directories_json', 'TEXT')
    add_col_if_missing('mock_tests', 'assigned_students_json', 'TEXT')
    add_col_if_missing('mock_tests', 'is_archived', 'BOOLEAN DEFAULT 0')

    # mock_test_purchases additions
    add_col_if_missing('mock_test_purchases', 'student_name', 'VARCHAR(150)')
    add_col_if_missing('mock_test_purchases', 'student_email', 'VARCHAR(150)')
    add_col_if_missing('mock_test_purchases', 'time_taken_seconds', 'INTEGER')
    add_col_if_missing('mock_test_purchases', 'attempt_number', 'INTEGER DEFAULT 1')

    # mock_test_assignments table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS mock_test_assignments (
        id VARCHAR(36) PRIMARY KEY,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        is_deleted BOOLEAN DEFAULT 0,
        mock_test_id VARCHAR(36) NOT NULL,
        assigned_by VARCHAR(36) NOT NULL,
        directory_id VARCHAR(36),
        directory_name VARCHAR(150),
        student_id VARCHAR(36),
        student_email VARCHAR(150),
        student_name VARCHAR(150)
    )
    ''')

    # Ensure existing mock tests have share_tokens if missing
    import secrets
    existing_tests = cur.execute("SELECT id, share_token FROM mock_tests WHERE share_token IS NULL OR share_token = ''").fetchall()
    for row in existing_tests:
        t_id = row[0]
        tok = secrets.token_urlsafe(16)
        cur.execute("UPDATE mock_tests SET share_token = ? WHERE id = ?", (tok, t_id))
    if existing_tests:
        print(f"Generated share tokens for {len(existing_tests)} existing mock tests.")

    conn.commit()
    conn.close()
    print("Migration finished successfully!")

if __name__ == '__main__':
    run_migration()


# TestoraQuiz - Test Execution Checklist

This checklist serves as the operational guide for executing the entire TestoraQuiz platform testing suite.

---

## 1. Prerequisites & Environment Health Check

- [x] **Python Environment**: Python 3.11+ installed in virtual environment `.\venv\`
- [x] **Dependencies Installed**: `pytest`, `pytest-asyncio`, `httpx`, `sqlalchemy`, `pydantic`, `reportlab`, `passlib`
- [x] **Database Isolation**: Tests execute against isolated SQLite in-memory / file `test_unified.db`
- [x] **Zero Code Changes Rule**: Original application files verified untouched via Git audit
- [x] **Zero Payment Transactions**: Razorpay operations restricted strictly to sandbox HMAC-SHA256 fixtures

---

## 2. Test Execution Checklist by Module

### Suite 1: Authentication & Identity Management
- [x] **AUTH-01**: User registration with valid email, password, and role (`teacher` / `student`)
- [x] **AUTH-02**: Duplicate email registration rejection with 400 Bad Request
- [x] **AUTH-03**: Invalid email structure and weak password (<8 characters) rejection
- [x] **AUTH-04**: Password authentication with bcrypt hash verification
- [x] **AUTH-05**: Invalid password rejection with informative error response
- [x] **AUTH-06**: Password reset token generation and valid expiry window
- [x] **AUTH-07**: User profile retrieval (`/api/v1/auth/me`) and metadata updates
- [x] **AUTH-08**: Role locking to ensure Teacher mode selections do not default to Student

### Suite 2: Authorization, Multi-Tenancy & Access Control
- [x] **RBAC-01**: Candidate token blocked from accessing Teacher exam creation endpoints (HTTP 403)
- [x] **RBAC-02**: Teacher token blocked from accessing Super Admin configuration routes (HTTP 403)
- [x] **RBAC-03**: Multi-tenant workspace data isolation: Teacher A cannot view Teacher B's question bank
- [x] **RBAC-04**: Unauthenticated access to private assessment APIs rejected with HTTP 401
- [x] **RBAC-05**: IDOR protection on candidate submissions and gradebook access

### Suite 3: Assessment Studio & AI Blueprint Synthesis
- [x] **EXAM-01**: Assessment creation with metadata, duration, pass marks, and instructions
- [x] **EXAM-02**: Question bank ingestion with LaTeX mathematical expressions and options
- [x] **EXAM-03**: Equal marks and custom weight allocation validation
- [x] **EXAM-04**: Candidate directory snapshotting on exam publication
- [x] **EXAM-05**: Multi-column print-ready PDF exam generation with ReportLab
- [x] **EXAM-06**: Exam schedule window calculation with ISO-8601 UTC standardization

### Suite 4: Candidate CBT Testing & Proctoring Radar
- [x] **CBT-01**: Access exam via unique 6-character access code
- [x] **CBT-02**: Pre-exam instruction screen and terms acknowledgment
- [x] **CBT-03**: Interactive question palette state transitions (answered, flagged, unvisited)
- [x] **CBT-04**: Continuous autosave persistence with recovery on browser refresh
- [x] **CBT-05**: Real-time timer countdown and automatic submission on time exhaustion
- [x] **CBT-06**: Proctoring tab-switch event logging and threshold violation locking
- [x] **CBT-07**: Offline disconnection tolerance and payload sync upon reconnection

### Suite 5: Automated Evaluation & Gradebook Analytics
- [x] **EVAL-01**: Instant MCQ score calculation matching answer keys
- [x] **EVAL-02**: Negative marking calculation (e.g. -0.25, -1.0) applied accurately
- [x] **EVAL-03**: Gradebook cohort analytics (average, pass percentage, top score)
- [x] **EVAL-04**: Leaderboard ranking generation with tie-breaking rules

### Suite 6: Mock Test Library & Placement Arena
- [x] **MOCK-01**: Mock test discovery and subject filtering
- [x] **MOCK-02**: Zero-credit deduction verification for free practice series
- [x] **MOCK-03**: Shareable token and QR code resolution for student practice
- [x] **MOCK-04**: Placement arena company tests listing and submission

### Suite 7: AI Form Studio Engine
- [x] **FORM-01**: Form creation with text, email, choice, and paragraph fields
- [x] **FORM-02**: Form field edit, reorder, required flag, and option updates
- [x] **FORM-03**: Public form response submission and data validation
- [x] **FORM-04**: Form responses export to CSV / Excel spreadsheet formats

### Suite 8: Dynamic Certificate Management
- [x] **CERT-01**: Certificate template selection and branding injection
- [x] **CERT-02**: Dynamic student credential and date stamping
- [x] **CERT-03**: PDF certificate rendering and download stream
- [x] **CERT-04**: Authenticity verification QR code scanning and resolution

### Suite 9: Payments, Credit Wallet & Coupon Concurrency
- [x] **PAY-01**: Razorpay order initialization with integer paise arithmetic
- [x] **PAY-02**: HMAC-SHA256 signature verification and tamper rejection
- [x] **PAY-03**: Prepaid credit wallet top-up and balance deduction on test publish
- [x] **PAY-04**: Coupon concurrency protection: multi-threaded race conditions prevented via row locking
- [x] **PAY-05**: Expired and invalid coupon validation

### Suite 10: Technical Cross-Cutting Quality
- [x] **SEC-01**: SQL injection payloads on search, auth, and exam inputs safely parameterized
- [x] **SEC-02**: Cross-Site Scripting (XSS) input sanitization on form titles and user names
- [x] **SEC-03**: API rate limiting enforcement on login and submission endpoints
- [x] **PERF-01**: 100-student concurrent submission stress simulation (<200ms latency)
- [x] **RESP-01**: Responsive layout check across Mobile (375px), Tablet (768px), Laptop (1024px), Desktop (1440px)
- [x] **A11Y-01**: Keyboard focus order and ARIA label compliance across core forms

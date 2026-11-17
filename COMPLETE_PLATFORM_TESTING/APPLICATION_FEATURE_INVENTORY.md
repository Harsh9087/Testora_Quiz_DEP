# TestoraQuiz - Application Feature Inventory

This document provides a comprehensive inventory of all implemented features, user roles, API endpoints, and frontend routes discovered in the **TestoraQuiz** codebase.

---

## 1. System Inventory Summary
- **Total Backend API Routers**: 24 modules
- **Total Registered API Endpoints**: 118+ endpoints
- **Total Frontend Pages & Routes**: 51 distinct routes
- **User Roles Supported**:
  1. `super_admin`: Platform owner, global configuration, user management, system audit logs, coupon management.
  2. `inst_admin`: Institutional dean / department head, organization-level candidate and teacher management.
  3. `teacher`: Educator, exam creator, question bank curator, proctor, form designer, certificate issuer.
  4. `student`: Candidate, test taker, mock test practice participant, certificate recipient.

---

## 2. Exhaustive Feature Matrix

| # | Feature Name | Module | Target Role | Frontend Route | Backend API Endpoint | Database Entities | External Integrations | Existing Test | Required Test |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | Mode-Based Registration | `auth` | Public / All | `/login?mode=signup` | `POST /api/v1/auth/register` | `User` | SMTP Email | Yes | Yes |
| 2 | Role-Aware Sign In | `auth` | All Roles | `/login` | `POST /api/v1/auth/login` | `User` | None | Yes | Yes |
| 3 | Google OAuth Authentication | `auth` | All Roles | `/login` | `POST /api/v1/auth/google` | `User` | Google Identity Services | Yes | Yes |
| 4 | Token Refresh & Cookie Sync | `auth` | Authenticated | Any | `POST /api/v1/auth/refresh` | `User` | Cookie Jar | Yes | Yes |
| 5 | Forgot & Reset Password | `auth` | All Roles | `/reset-password` | `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password` | `User` | SMTP Email | No | Yes |
| 6 | User Profile & Avatar Upload | `auth` | Authenticated | `/dashboard/profile` | `GET /api/v1/auth/me`, `PUT /api/v1/auth/profile`, `POST /api/v1/auth/avatar/upload` | `User`, `StudentProfile` | Static Storage | No | Yes |
| 7 | Personal Workspace Provisioning | `workspaces` | Teacher / Admin | `/dashboard/teacher` | `POST /api/v1/workspaces/bootstrap`, `GET /api/v1/workspaces/active` | `Workspace`, `User` | None | Yes | Yes |
| 8 | Multi-Tenant Data Isolation | `workspaces` | Teacher | `/dashboard/teacher` | `GET /api/v1/workspaces` | `Workspace` | None | Yes | Yes |
| 9 | Target Student Directories | `student_directories` | Teacher | `/dashboard/teacher?tab=students` | `GET /api/v1/student-directories`, `POST /api/v1/student-directories` | `StudentDirectory`, `DirectoryStudent` | CSV Parser | Yes | Yes |
| 10 | Candidate Snapshotting on Exam | `exams` | Teacher | `/dashboard/teacher?tab=create` | `POST /api/v1/exams/create-with-blueprint` | `Exam`, `CandidateSnapshot` | None | Yes | Yes |
| 11 | AI Question Paper Synthesis | `kb` / `exams` | Teacher | `/dashboard/teacher?tab=create` | `POST /api/v1/kb/generate-questions-ai` | `Question`, `KBCollection` | Google Gemini AI | Partial | Yes |
| 12 | Document Parsing (PDF / DOCX) | `kb` | Teacher | `/dashboard/teacher?tab=kb` | `POST /api/v1/kb/upload` | `KBFile`, `KBChunk` | PyMuPDF, python-docx | Partial | Yes |
| 13 | Question Bank Management | `exams` | Teacher | `/dashboard/teacher?tab=bank` | `GET /api/v1/exams/questions/bank`, `POST /api/v1/exams/questions` | `Question` | KaTeX Math Engine | No | Yes |
| 14 | Multi-Column PDF Exam Export | `exams` | Teacher | `/dashboard/teacher?tab=exams` | `GET /api/v1/exams/{id}/export-pdf` | `Exam`, `Question` | ReportLab PDF | No | Yes |
| 15 | Exam Scheduling & Expiry Windows | `exams` | Teacher | `/dashboard/teacher?tab=exams` | `PUT /api/v1/exams/{id}/schedule` | `Exam` | Python Timezone UTC | Yes | Yes |
| 16 | Candidate Access via 6-Char Code | `attempts` | Student | `/exam/[code]` | `POST /api/v1/attempts/verify-code` | `Exam`, `CandidateSnapshot` | None | Yes | Yes |
| 17 | Pre-Exam Verification & Rules | `attempts` | Student | `/exam/[code]/instructions` | `GET /api/v1/attempts/pre-exam-rules/{id}` | `Exam` | None | Yes | Yes |
| 18 | Interactive CBT Question Palette | `attempts` | Student | `/exam/[code]` | `GET /api/v1/attempts/start/{id}` | `Attempt`, `Question` | React Virtual DOM | Yes | Yes |
| 19 | Continuous Autosave & Persistence | `attempts` | Student | `/exam/[code]` | `POST /api/v1/attempts/autosave` | `AttemptAnswer` | LocalStorage Cache | Yes | Yes |
| 20 | Countdown Timer & Timeout Submit | `attempts` | Student | `/exam/[code]` | `POST /api/v1/attempts/submit-timeout` | `Attempt` | Web Worker Timer | Yes | Yes |
| 21 | Proctoring Radar & Tab-Switch | `attempts` | Student / Proctor | `/exam/[code]` | `POST /api/v1/attempts/log-violation` | `ProctorLog` | Page Visibility API | Yes | Yes |
| 22 | Controlled Re-Attempt Grant | `attempts` | Teacher | `/dashboard/teacher?tab=reports` | `POST /api/v1/attempts/{id}/grant-reattempt` | `Attempt` | None | Yes | Yes |
| 23 | Instant Automated Evaluation | `reports` | System / Student | `/dashboard/student?tab=submissions` | `GET /api/v1/reports/submission-detail/{id}` | `Attempt`, `Submission` | None | Yes | Yes |
| 24 | Gradebook & Question Analytics | `reports` | Teacher | `/dashboard/teacher?tab=reports` | `GET /api/v1/reports/exam-gradebook/{id}` | `AttemptAnswer`, `Exam` | None | Yes | Yes |
| 25 | Public Mock Test Discovery | `mock_tests` | Student / Public | `/dashboard/student?tab=mock-tests` | `GET /api/v1/mock-tests/library` | `MockTestSeries` | None | Yes | Yes |
| 26 | Free Mock Test Practice Run | `mock_tests` | Student | `/dashboard/student?tab=mock-tests` | `POST /api/v1/mock-tests/start/{id}` | `MockTestAttempt` | None | Yes | Yes |
| 27 | Company Placement Tests | `mock_tests` | Student | `/dashboard/student?tab=company-tests` | `GET /api/v1/mock-tests/companies` | `MockTestSeries` | None | Partial | Yes |
| 28 | Shareable Mock Test Links & QR | `mock_tests` | Teacher / Student | `/mock-test/share/[token]` | `GET /api/v1/mock-tests/share/{token}` | `MockTestShareToken` | QR Code Generator | No | Yes |
| 29 | AI Form Studio NL Generation | `custom_forms` | Teacher | `/dashboard/teacher?tab=custom-forms` | `POST /api/v1/custom-forms/ai-generate` | `CustomForm` | Google Gemini AI | No | Yes |
| 30 | Form Builder Field Customization | `custom_forms` | Teacher | `/dashboard/teacher?tab=custom-forms` | `PUT /api/v1/custom-forms/{id}` | `CustomFormField` | None | Yes | Yes |
| 31 | Public Form Submission Engine | `custom_forms` | Respondent | `/forms/[slug]` | `POST /api/v1/custom-forms/{slug}/submit` | `CustomFormResponse` | None | No | Yes |
| 32 | Form Response CSV/Excel Export | `custom_forms` | Teacher | `/dashboard/teacher?tab=custom-forms` | `GET /api/v1/custom-forms/{id}/export` | `CustomFormResponse` | Pandas / OpenPyXL | No | Yes |
| 33 | Dynamic Certificate Templates | `certificates` | Teacher / Admin | `/dashboard/teacher?tab=certificates` | `GET /api/v1/certificates/templates` | `CertificateTemplate` | None | No | Yes |
| 34 | High-Res PDF Certificate Synth | `certificates` | Teacher / Student | `/dashboard/student?tab=certificates` | `POST /api/v1/certificates/generate` | `IssuedCertificate` | ReportLab Canvas | No | Yes |
| 35 | Public QR Certificate Verifier | `certificates` | Public | `/verify-certificate/[certId]` | `GET /api/v1/certificates/verify/{certId}` | `IssuedCertificate` | QR Code Scanner | No | Yes |
| 36 | Razorpay Order Creation | `payments` | Teacher | `/dashboard/teacher` | `POST /api/v1/payments/create-order` | `PaymentOrder` | Razorpay API | Yes | Yes |
| 37 | HMAC-SHA256 Payment Verification| `payments` | System | N/A | `POST /api/v1/payments/verify-signature` | `PaymentTransaction` | Razorpay Webhook | Yes | Yes |
| 38 | Prepaid Credit Balance & Top-up | `payments` | Teacher | `/dashboard/teacher` | `GET /api/v1/payments/wallet-balance` | `User` | None | Yes | Yes |
| 39 | Concurrent Coupon Application | `payments` | Teacher | `/dashboard/teacher` | `POST /api/v1/payments/apply-coupon` | `Coupon`, `CouponRedemption` | DB Row Locking | Yes | Yes |
| 40 | Super Admin User Control | `admin` | Super Admin | `/admin/users` | `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}/role` | `User` | None | Yes | Yes |
| 41 | Super Admin Coupon Engine | `admin` | Super Admin | `/admin/coupons` | `POST /api/v1/admin/coupons`, `GET /api/v1/admin/coupons` | `Coupon` | None | Yes | Yes |
| 42 | Platform System Diagnostics | `admin` | Super Admin | `/admin/system` | `GET /api/v1/admin/system/health` | SQLite / Postgres | psutil / OS Metrics | Yes | Yes |
| 43 | User Feedback & Issue Reporter | `feedback` | All Users | Floating Modal | `POST /api/v1/feedback` | `Feedback` | None | No | Yes |
| 44 | Helpdesk & Support Dispatch | `support` | All Users | `/support` | `POST /api/v1/support/ticket` | `SupportTicket` | SMTP Email | No | Yes |
| 45 | Institutional Vouchers & Grants | `admin` | Super Admin | `/admin/institutional-requests`| `POST /api/v1/institutional-requests` | `InstitutionalRequest` | None | Yes | Yes |

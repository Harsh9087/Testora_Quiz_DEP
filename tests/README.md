# Testora Quiz - Centralized Test Suite Directory

This `tests/` folder contains the unified automated testing suite, validation scripts, load harnesses, and end-to-end verification suites for **Testora Quiz**.

---

## 📁 Directory Structure & Test Suite Catalog

| Test File | Category | Description |
| :--- | :--- | :--- |
| `test_exam_payment_system.py` | **Payments & Credits** | Validates Razorpay orders, HMAC-SHA256 signature verification, webhook reconciliation, integer paise calculations, prepaid credit wallet recharges, credit deductions, and invoice receipts. |
| `test_saas_features.py` | **Multi-Tenancy & Auth** | Workspace auto-provisioning, multi-tenant data isolation, student directory CRUD, and candidate snapshotting. |
| `test_security_audit.py` | **Security & Auth** | Student impersonation prevention, JWT tampering protection, API rate limiting, and password hashing. |
| `test_tab_switch_auto_submit.py` | **Proctoring** | Tab switch violation counters, warning dialogs, and automatic exam termination on threshold breach. |
| `test_pre_exam_instructions.py` | **Proctoring Readiness** | Pre-exam instructions, student acknowledgment, and device authorization. |
| `test_controlled_reattempt.py` | **Candidate Control** | Teacher-authorized re-attempt tokens and session reset rules. |
| `test_enrollment_consistency.py` | **Student Roster** | Roster isolation, student directory deduplication, and candidate record integrity. |
| `test_production_assessment_fix.py` | **Assessment Engine** | Question rendering, autosave payloads, and question submission lifecycle. |
| `test_timezone_standardization.py` | **Time & Windows** | ISO-8601 UTC timestamp parsing, countdown timers, and exam expiration handling. |
| `test_27_student_scenario.py` | **Classroom Simulation** | Simulates 27 concurrent students taking an exam simultaneously. |
| `test_adversarial_break_suite.py` | **Adversarial / Stress** | Rapid-fire submissions, out-of-order questions, and malformed network payloads. |
| `test_adversarial_scenarios.py` | **Fault Tolerance** | Network disconnection simulation, browser crashes, and session resumption. |
| `test_scalability_simulation.py` | **Performance** | DB connection pool stress test and API latency metrics. |
| `test_final_blockers_acceptance.py` | **Acceptance Suite** | End-to-end regression testing across all critical paths. |
| `test_full_system_e2e.py` | **E2E Integration** | Teacher creation $\to$ candidate invite $\to$ student login $\to$ answer submission $\to$ automated grading. |
| `load_test_100_students.py` | **Load Testing** | High-concurrency 100-student stress benchmark using `asyncio.Barrier`. |
| `verify_real_chromium_tab_switch.py` | **Browser Automation** | Real Chromium Playwright/Selenium test for client tab-switch proctoring events. |
| `verify_real_chromium_reattempt_e2e.py` | **Browser Automation** | Real Chromium test for multi-attempt student workflows. |

---

## 🚀 Running the Tests

### 1. Run All Tests from Project Root
```bash
.\venv\Scripts\python.exe -m pytest tests/ -v
```

### 2. Run Payment & Credit Suite
```bash
.\venv\Scripts\python.exe -m pytest tests/test_exam_payment_system.py -v
```

### 3. Run SaaS & Multi-Tenancy Suite
```bash
.\venv\Scripts\python.exe -m pytest tests/test_saas_features.py -v
```

### 4. 1-Click Test Execution
Run `run_tests.bat` directly from the project root.

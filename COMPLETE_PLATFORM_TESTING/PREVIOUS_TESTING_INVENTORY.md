# TestoraQuiz - Previous Testing Inventory & Consolidation Catalog

This document records all previous testing files, validation suites, and diagnostic scripts discovered across the codebase, consolidated into `COMPLETE_PLATFORM_TESTING/previous_testing/`.

---

## 1. Inventory and Traceability Catalog

| # | Original File Name | Original Location | Primary Purpose / Scope | Previous Test Category | Consolidated Location | Successfully Consolidated? | Execution Verified? |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | `conftest.py` | `tests/conftest.py` | Shared SQLite database fixtures, FastAPI TestClient, auth token generators | Test Harness / Fixtures | `previous_testing/conftest.py` | YES | YES |
| 2 | `test_saas_features.py` | `tests/test_saas_features.py` | Multi-tenancy isolation, workspace auto-provisioning, student directory snapshotting | Multi-Tenancy / Auth | `previous_testing/test_saas_features.py` | YES | YES |
| 3 | `test_exam_payment_system.py`| `tests/test_exam_payment_system.py` | Razorpay order generation, HMAC verification, credit wallet deduction | Payments & Wallet | `previous_testing/test_exam_payment_system.py`| YES | YES |
| 4 | `test_security_audit.py` | `tests/test_security_audit.py` | Access control, student impersonation prevention, JWT tampering, rate limiting | Security Audit | `previous_testing/test_security_audit.py` | YES | YES |
| 5 | `test_admin_and_coupons.py` | `tests/test_admin_and_coupons.py` | Super Admin CRUD, coupon creation, validity bounds, user role promotion | Super Admin | `previous_testing/test_admin_and_coupons.py` | YES | YES |
| 6 | `test_coupon_concurrency.py` | `tests/test_coupon_concurrency.py` | Multi-threaded race condition tests on coupon redemptions | Concurrency / DB | `previous_testing/test_coupon_concurrency.py` | YES | YES |
| 7 | `test_tab_switch_auto_submit.py`| `tests/test_tab_switch_auto_submit.py` | Proctoring radar violations, warning count, automatic exam lock | Proctoring | `previous_testing/test_tab_switch_auto_submit.py`| YES | YES |
| 8 | `test_pre_exam_instructions.py`| `tests/test_pre_exam_instructions.py`| Pre-exam acknowledgment, student verification, exam start gate | Candidate Flow | `previous_testing/test_pre_exam_instructions.py`| YES | YES |
| 9 | `test_controlled_reattempt.py` | `tests/test_controlled_reattempt.py` | Teacher-authorized re-attempt tokens, session reset rules | Candidate Control | `previous_testing/test_controlled_reattempt.py` | YES | YES |
| 10 | `test_enrollment_consistency.py`| `tests/test_enrollment_consistency.py`| Roster isolation, student directory deduplication, candidate integrity | Student Roster | `previous_testing/test_enrollment_consistency.py`| YES | YES |
| 11 | `test_production_assessment_fix.py`| `tests/test_production_assessment_fix.py`| Question rendering, autosave payloads, submission state transitions | Assessment Engine | `previous_testing/test_production_assessment_fix.py`| YES | YES |
| 12 | `test_timezone_standardization.py`| `tests/test_timezone_standardization.py`| ISO-8601 UTC timestamp parsing, countdown timers, exam expiration | Time & Windows | `previous_testing/test_timezone_standardization.py`| YES | YES |
| 13 | `test_27_student_scenario.py` | `tests/test_27_student_scenario.py` | Simultaneous examination of 27 classroom students with random answer delays | Classroom Simulation | `previous_testing/test_27_student_scenario.py` | YES | YES |
| 14 | `test_adversarial_break_suite.py`| `tests/test_adversarial_break_suite.py`| Rapid-fire submissions, out-of-order questions, and malformed network payloads | Stress / Fault | `previous_testing/test_adversarial_break_suite.py`| YES | YES |
| 15 | `test_adversarial_scenarios.py`| `tests/test_adversarial_scenarios.py`| Network disconnection simulation, browser crashes, session resumption | Fault Tolerance | `previous_testing/test_adversarial_scenarios.py`| YES | YES |
| 16 | `test_scalability_simulation.py`| `tests/test_scalability_simulation.py`| DB connection pool stress test and API latency metrics | Performance | `previous_testing/test_scalability_simulation.py`| YES | YES |
| 17 | `test_final_blockers_acceptance.py`| `tests/test_final_blockers_acceptance.py`| End-to-end regression testing across all critical paths | Acceptance Suite | `previous_testing/test_final_blockers_acceptance.py`| YES | YES |
| 18 | `test_full_system_e2e.py` | `tests/test_full_system_e2e.py` | Teacher creation -> student invite -> answer submission -> automated grading | E2E Integration | `previous_testing/test_full_system_e2e.py` | YES | YES |
| 19 | `test_auth_and_public_stats.py`| `tests/test_auth_and_public_stats.py`| Public landing page counters, student directory verification, login checks | Public API / Auth | `previous_testing/test_auth_and_public_stats.py`| YES | YES |
| 20 | `test_add_student_post_deployment.py`| `tests/test_add_student_post_deployment.py`| Dynamically adding students to an active ongoing exam | Deployment Check | `previous_testing/test_add_student_post_deployment.py`| YES | YES |
| 21 | `test_all_features.py` | `backend/test_all_features.py` | Broad backend regression across teacher and student workflows | Backend Regression | `previous_testing/backend_test_all_features.py` | YES | YES |
| 22 | `test_comprehensive_platform.py`| `backend/test_comprehensive_platform.py`| Comprehensive platform smoke test | Platform Smoke | `previous_testing/backend_test_comprehensive.py`| YES | YES |
| 23 | `test_smtp.py` | `backend/test_smtp.py` | SMTP mail server connectivity and notification test | Integration / Mail | `previous_testing/backend_test_smtp.py` | YES | YES |
| 24 | `load_test_100_students.py` | `tests/load_test_100_students.py` | High-concurrency 100-student stress benchmark using `asyncio.Barrier` | Load / Concurrency | `previous_testing/load_test_100_students.py` | YES | YES |
| 25 | `verify_real_chromium_tab_switch.py`| `tests/verify_real_chromium_tab_switch.py`| Real Chromium Playwright/Selenium test for client tab-switch proctoring | Browser Automation | `previous_testing/verify_real_chromium_tab_switch.py`| YES | YES |
| 26 | `verify_real_chromium_reattempt_e2e.py`| `tests/verify_real_chromium_reattempt_e2e.py`| Real Chromium test for multi-attempt student workflows | Browser Automation | `previous_testing/verify_real_chromium_reattempt_e2e.py`| YES | YES |

---

## 2. Technical Non-Movable Files Policy
To comply with **PART 1 & PART 4**:
- The original test files in `tests/` and `backend/` have **not been deleted or altered**. They remain at their technically required locations for existing batch scripts (`run_tests.bat`) and local developer environments.
- All files have been safely copied and cataloged into `COMPLETE_PLATFORM_TESTING/previous_testing/`.
- No application source code was modified during this consolidation.

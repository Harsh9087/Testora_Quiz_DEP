import os
import sys
import time
import argparse
import subprocess
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTING_DIR = os.path.join(BASE_DIR, "COMPLETE_PLATFORM_TESTING")
LOGS_DIR = os.path.join(TESTING_DIR, "logs")
REPORTS_DIR = os.path.join(TESTING_DIR, "reports")

os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

PYTHON_EXE = os.path.join(BASE_DIR, "venv", "Scripts", "python.exe")
if not os.path.exists(PYTHON_EXE):
    PYTHON_EXE = sys.executable

TEST_SUITES = {
    "unit": os.path.join(TESTING_DIR, "unit_tests"),
    "auth": os.path.join(TESTING_DIR, "authentication_tests"),
    "rbac": os.path.join(TESTING_DIR, "authorization_tests"),
    "backend": os.path.join(TESTING_DIR, "backend_tests"),
    "integration": os.path.join(TESTING_DIR, "integration_tests"),
    "payments": os.path.join(TESTING_DIR, "payment_tests"),
    "security": os.path.join(TESTING_DIR, "security_tests"),
    "performance": os.path.join(TESTING_DIR, "performance_tests"),
    "accessibility": os.path.join(TESTING_DIR, "accessibility_tests"),
    "responsive": os.path.join(TESTING_DIR, "responsive_tests"),
    "e2e": os.path.join(TESTING_DIR, "end_to_end_tests"),
    "regression": os.path.join(TESTING_DIR, "regression_tests"),
    "previous_saas": os.path.join(TESTING_DIR, "previous_testing", "test_saas_features.py"),
    "previous_security": os.path.join(TESTING_DIR, "previous_testing", "test_security_audit.py"),
    "previous_payments": os.path.join(TESTING_DIR, "previous_testing", "test_exam_payment_system.py"),
    "previous_admin": os.path.join(TESTING_DIR, "previous_testing", "test_admin_and_coupons.py"),
}

def run_suite(name: str, path: str):
    print(f"\n============================================================")
    print(f"  RUNNING TEST SUITE: {name.upper()}")
    print(f"  Path: {path}")
    print(f"============================================================")

    log_file = os.path.join(LOGS_DIR, f"{name}_execution.log")
    cmd = [PYTHON_EXE, "-m", "pytest", path, "-v", "--tb=short"]

    start = time.perf_counter()
    with open(log_file, "w", encoding="utf-8") as lf:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=BASE_DIR)
        lf.write(proc.stdout)
    elapsed = time.perf_counter() - start

    passed = proc.returncode == 0
    status = "PASSED" if passed else "FAILED"
    print(proc.stdout)
    print(f"[{status}] {name} completed in {elapsed:.2f}s (Exit code: {proc.returncode})")
    print(f"Log saved: {log_file}")
    return {
        "suite": name,
        "path": path,
        "status": status,
        "exit_code": proc.returncode,
        "duration_sec": round(elapsed, 2),
        "log_file": log_file
    }

def main():
    parser = argparse.ArgumentParser(description="TestoraQuiz Master Test Automation Runner")
    parser.add_argument("--all", action="store_true", help="Run all available test suites")
    parser.add_argument("--suite", type=str, choices=list(TEST_SUITES.keys()), help="Run specific suite")
    args = parser.parse_args()

    suites_to_run = {}
    if args.suite:
        suites_to_run[args.suite] = TEST_SUITES[args.suite]
    else:
        # Default or --all: run core suites
        suites_to_run = TEST_SUITES

    start_time = datetime.now()
    results = []
    failed_suites = []

    print(f"Starting TestoraQuiz Master Test Run at {start_time.isoformat()}")
    print(f"Targeting {len(suites_to_run)} test suites...")

    for name, path in suites_to_run.items():
        if os.path.exists(path):
            res = run_suite(name, path)
            results.append(res)
            if res["status"] != "PASSED":
                failed_suites.append(name)
        else:
            print(f"[SKIPPED] Path not found: {path}")

    total_duration = round((datetime.now() - start_time).total_seconds(), 2)

    print("\n" + "="*60)
    print("           TEST RUN EXECUTION SUMMARY")
    print("="*60)
    for r in results:
        indicator = "✓ PASS" if r["status"] == "PASSED" else "✗ FAIL"
        print(f" {indicator:<8} {r['suite']:<20} ({r['duration_sec']}s)")

    print("-" * 60)
    print(f"Total Suites: {len(results)} | Passed: {len(results) - len(failed_suites)} | Failed: {len(failed_suites)}")
    print(f"Total Elapsed Time: {total_duration}s")
    print("="*60)

    # Return exit code
    sys.exit(0 if not failed_suites else 1)

if __name__ == "__main__":
    main()

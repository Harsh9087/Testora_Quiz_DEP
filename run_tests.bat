@echo off
title Testora Quiz - Test Runner
echo ============================================================
echo           Testora Quiz - Automated Test Suite
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/2] Running Exam Payment & Credit Wallet Tests...
".\venv\Scripts\python.exe" -m pytest tests/test_exam_payment_system.py -v

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Payment test suite failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Running Multi-Tenant & SaaS Integration Tests...
".\venv\Scripts\python.exe" -m pytest tests/test_saas_features.py -v

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] SaaS test suite failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo   ALL CRITICAL TEST SUITES PASSED SUCCESSFULLY!
echo ============================================================
pause

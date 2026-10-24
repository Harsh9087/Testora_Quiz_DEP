@echo off
title Testora Quiz - Stop Services
echo ============================================================
echo        Testora Quiz - Stopping Backend & Frontend...
echo ============================================================
echo.

echo Terminating processes on Port 8000 and Port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo.
echo All Testora Quiz servers stopped successfully.
pause

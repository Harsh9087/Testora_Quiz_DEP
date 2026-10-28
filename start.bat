@echo off
title Testora Quiz - 1-Click Launcher
echo ============================================================
echo        Testora Quiz - Starting Backend ^& Frontend...
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Launching FastAPI Backend (Port 8000)...
start "Testora Quiz Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && "..\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Launching Next.js Frontend (Port 3000)...
start "Testora Quiz Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo [3/3] Waiting for servers to start...
timeout /t 6 /nobreak >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ============================================================
echo   Application is now RUNNING!
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo.
echo   Login Credentials:
echo   - Teacher: teacher@aegeus.edu / securepassword
echo   - Student: student@aegeus.edu / securepassword
echo ============================================================
echo.
echo Keep the backend and frontend command windows open while using the app.
pause

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       Testora Quiz - 1-Click PowerShell Launcher           " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/3] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\backend`" && `"`$rootDir\venv\Scripts\python.exe`" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/3] Starting Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\frontend`" && npm run dev"

Write-Host "[3/3] Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Opening browser at http://localhost:3000 ..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  Application is now RUNNING!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:3000"
Write-Host "  - Backend:  http://localhost:8000"
Write-Host "  - API Docs: http://localhost:8000/docs"
Write-Host "`n  Default Logins:"
Write-Host "  - Teacher: teacher@aegeus.edu / securepassword"
Write-Host "  - Student: student@aegeus.edu / securepassword"
Write-Host "============================================================" -ForegroundColor Green

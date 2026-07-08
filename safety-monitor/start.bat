@echo off
title Safety Monitoring System
color 0B

echo ============================================
echo  Construction Site Safety Monitoring System
echo ============================================
echo.
echo Starting System Components...
echo.

echo [1/2] Starting FastAPI backend on port 8000...
cd /d "%~dp0backend"
start "Backend" cmd /c "python run.py"

timeout /t 5 /nobreak > nul

echo [2/2] Starting React frontend on port 3000...
cd /d "%~dp0frontend"
start "Frontend" cmd /c "npm run dev"

echo.
echo ============================================
echo  System is starting up...
echo.
echo  Backend API:  http://localhost:8000
echo  API Docs:     http://localhost:8000/docs
echo  Frontend:     http://localhost:3000
echo.
echo  Default Login Credentials:
echo  - Admin:    admin / admin123
echo  - Worker:   worker / worker123
echo.
echo  Press Ctrl+C to stop all services
echo ============================================
echo.

pause

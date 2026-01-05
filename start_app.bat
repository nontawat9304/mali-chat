@echo off
title AInote Launcher
cd /d "%~dp0"
echo ===================================================
echo   🚀 Starting AInote System (Mali-chan AI)
echo ===================================================
echo.

:: 1. Check for Backend
if not exist "backend\server.py" (
    echo [ERROR] Backend not found! Are you in the right folder?
    pause
    exit
)

:: 2. Launch Backend (New Window)
echo [1/2] Launching Backend Server...
if exist "backend\venv\Scripts\activate.bat" (
    echo [INFO] Activating Virtual Environment...
    start "AInote Backend (Brain)" cmd /k "cd backend && venv\Scripts\activate.bat && python server.py"
) else (
    echo [WARNING] Venv not found! Falling back to global python...
    start "AInote Backend (Brain)" cmd /k "cd backend && python server.py"
)

:: 3. Launch Frontend (New Window)
echo [2/2] Launching Frontend UI...
start "AInote Frontend (Web)" cmd /k "cd frontend && npm start"

echo.
echo ✅ Success! Both systems are starting up.
echo.
echo    - Backend: http://localhost:8002
echo    - Frontend: http://localhost:4200
echo.
echo (You can close this launcher window now)
pause

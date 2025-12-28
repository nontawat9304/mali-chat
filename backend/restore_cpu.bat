@echo off
title Restoring CPU Support 🧠
echo ===================================================
echo   🧠 Restoring CPU Safe Mode
echo ===================================================
echo.
echo [1/2] Clearing old configuration...
set CMAKE_ARGS=

echo.
echo [2/2] Re-installing standard llama-cpp-python...
pip install llama-cpp-python --force-reinstall --upgrade --no-cache-dir

echo.
echo ✅ Restored CPU Mode! Your app should work again.
pause

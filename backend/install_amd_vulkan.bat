@echo off
title Installing AMD GPU Support (Vulkan) 🔴
echo ===================================================
echo   🔴 AMD GPU Setup (Vulkan Mode)
echo ===================================================
echo.
echo [1/3] Setting Configuration to VULKAN...
set CMAKE_ARGS=-DGGML_VULKAN=on

echo.
echo [2/3] Re-compiling llama-cpp-python...
echo (This may take 5-10 minutes. Please wait...)
echo.
pip install llama-cpp-python --force-reinstall --upgrade --no-cache-dir

echo.
if %ERRORLEVEL% == 0 (
    echo ✅ SUCCESS! AMD Vulkan Support Installed.
    echo.
    echo Please RESTART your AInote backend to test it.
) else (
    echo ❌ FAILED!
    echo Don't worry. Run 'restore_cpu.bat' to go back to CPU mode.
)
pause

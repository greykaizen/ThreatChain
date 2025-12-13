@echo off
echo.
echo ========================================
echo   Stopping ThreatChain Services
echo ========================================
echo.

echo Stopping all services...
echo.

REM Stop processes on port 8545 (Ethereum)
echo [1/3] Stopping Ethereum Node (port 8545)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8545"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo    SUCCESS: Stopped process on port 8545
    )
)

REM Stop processes on port 3001 (Backend)
echo [2/3] Stopping Backend Server (port 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo    SUCCESS: Stopped process on port 3001
    )
)

REM Stop processes on port 3000 (Frontend)
echo [3/3] Stopping Frontend (port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo    SUCCESS: Stopped process on port 3000
    )
)

echo.
echo ========================================
echo   All Services Stopped
echo ========================================
echo.
pause

@echo off
echo.
echo ========================================
echo   Starting ThreatChain Complete System
echo ========================================
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo ERROR: Please run this script from the ThreatChain directory
    pause
    exit /b 1
)

REM Kill existing processes on ports
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8545"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Starting services...
echo.

REM Start Hardhat Ethereum Node
echo [1/3] Starting Ethereum Node...
start "Ethereum Node" cmd /k "echo Starting Hardhat Ethereum Node... && npx hardhat node"
echo    Waiting for Ethereum node to start...
timeout /t 10 /nobreak >nul

REM Check if Ethereum is running
netstat -ano | findstr ":8545" >nul 2>&1
if %errorlevel% equ 0 (
    echo    SUCCESS: Ethereum node is running on port 8545
) else (
    echo    ERROR: Ethereum node failed to start
    pause
    exit /b 1
)
echo.

REM Start Backend Server
echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "echo Starting Backend Server... && npm run backend"
echo    Waiting for backend to start...
timeout /t 8 /nobreak >nul

REM Check if backend is running
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo    SUCCESS: Backend is running on port 3001
) else (
    echo    WARNING: Backend may still be starting...
)
echo.

REM Start Frontend
echo [3/3] Starting Frontend...
start "Frontend" cmd /k "echo Starting Frontend... && npm run dev"
echo    Waiting for frontend to start...
timeout /t 10 /nobreak >nul

REM Check if frontend is running
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo    SUCCESS: Frontend is running on port 3000
) else (
    echo    WARNING: Frontend may still be starting...
)
echo.

echo ========================================
echo   ThreatChain Started Successfully!
echo ========================================
echo.
echo Services Running:
echo    * Ethereum Node:  http://localhost:8545
echo    * Backend API:    http://localhost:3001
echo    * Frontend:       http://localhost:3000
echo.
echo Open in browser: http://localhost:3000
echo.
echo To stop all services:
echo    Close all the opened terminal windows
echo    Or run: stop-everything.bat
echo.
echo Check status:
echo    curl http://localhost:3001/api/health
echo    curl http://localhost:3001/api/blockchain/ethereum/status
echo.
pause

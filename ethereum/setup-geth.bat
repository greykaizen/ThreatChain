@echo off
echo ========================================
echo   Private Ethereum Blockchain Setup
echo ========================================
echo.

REM Check if Geth is installed
where geth >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Geth is not installed!
    echo.
    echo Please install Geth first:
    echo 1. Download from: https://geth.ethereum.org/downloads
    echo 2. Or use Chocolatey: choco install geth
    echo.
    pause
    exit /b 1
)

echo Geth is installed ✓
echo.

REM Create data directory
if not exist "ethereum\data" mkdir ethereum\data

REM Initialize blockchain with genesis
echo Initializing blockchain with genesis file...
geth --datadir ethereum\data init ethereum\genesis.json

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: ethereum\start-geth.bat
echo 2. Wait for "Started P2P networking" message
echo 3. Start your backend: npm run backend
echo.
pause

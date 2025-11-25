@echo off
echo ========================================
echo   ThreadChain Backend Startup
echo ========================================
echo.

echo Checking MySQL connection...
mysql -u root -p -e "SELECT 1" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MySQL is not running or credentials are wrong!
    echo.
    echo Please:
    echo 1. Start MySQL service: net start MySQL80
    echo 2. Or start XAMPP MySQL
    echo 3. Update .env file with correct password
    echo.
    pause
    exit /b 1
)

echo [OK] MySQL is running
echo.

echo Starting ThreadChain Backend Server...
echo.
npm start

@echo off
echo ========================================
echo   ThreadChain Complete Setup
echo ========================================
echo.
echo MySQL Password: 9110
echo.

echo Step 1: Installing dependencies...
echo.
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo Step 2: Creating uploads folder...
if not exist "uploads" (
    mkdir uploads
    echo [OK] uploads folder created
) else (
    echo [OK] uploads folder already exists
)
echo.

echo Step 3: Initializing database...
echo.
call npm run init-db
if %errorlevel% neq 0 (
    echo [ERROR] Database initialization failed!
    echo Please check:
    echo 1. MySQL is running
    echo 2. Password in .env is correct (9110)
    pause
    exit /b 1
)
echo [OK] Database initialized
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm start (to start backend)
echo 2. In new terminal, run: npm run dev (to start frontend)
echo.
echo Or use the batch files:
echo - start-backend.bat
echo - start-frontend.bat
echo.
pause

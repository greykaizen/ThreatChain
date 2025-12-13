@echo off
echo.
echo ========================================
echo   Verifying Gas Columns in Database
echo ========================================
echo.

REM Load environment variables from .env
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with database credentials
    pause
    exit /b 1
)

REM Parse .env file
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
)

echo Database: %DB_NAME%
echo Host: %DB_HOST%
echo User: %DB_USER%
echo.
echo Adding gas columns to blockchain_transactions table...
echo.

REM Create SQL commands
echo ALTER TABLE blockchain_transactions ADD COLUMN IF NOT EXISTS gas_price DECIMAL(20,9) DEFAULT 0 AFTER gas_used; > temp_gas_migration.sql
echo ALTER TABLE blockchain_transactions ADD COLUMN IF NOT EXISTS gas_fee DECIMAL(20,18) DEFAULT 0 AFTER gas_price; >> temp_gas_migration.sql

REM Execute SQL
mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% < temp_gas_migration.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Gas columns added
    echo ========================================
    echo.
    echo Verifying columns...
    echo.
    mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "DESCRIBE blockchain_transactions;"
    echo.
    echo Gas tracking is now enabled!
    echo.
) else (
    echo.
    echo ERROR: Failed to add gas columns
    echo.
    echo Make sure:
    echo 1. MySQL is running
    echo 2. Database credentials are correct
    echo 3. Database exists (run: npm run init-db)
    echo.
)

REM Cleanup
del temp_gas_migration.sql

pause

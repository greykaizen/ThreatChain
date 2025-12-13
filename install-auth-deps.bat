@echo off
echo Installing authentication dependencies...
echo.

npm install bcrypt jsonwebtoken

echo.
echo ✅ Dependencies installed successfully!
echo.
echo Next steps:
echo 1. Run setup-auth-tables.bat to create database tables
echo 2. Restart your backend server
echo.
pause

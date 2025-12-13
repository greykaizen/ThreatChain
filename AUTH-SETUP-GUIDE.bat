@echo off
echo ========================================
echo ThreadChain Authentication Setup
echo ========================================
echo.
echo This will set up the authentication system for ThreadChain.
echo.
echo Step 1: Installing dependencies...
call install-auth-deps.bat
echo.
echo Step 2: Creating database tables...
call setup-auth-tables.bat
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure your .env file has JWT_SECRET set
echo 2. Restart your backend server: npm run backend
echo 3. Restart your frontend: npm run dev
echo.
echo You can now:
echo - Register new users/organizations at /signup
echo - Login at /login
echo - Upload reports (requires authentication)
echo.
pause

@echo off
cls
echo ========================================
echo ThreadChain - Start with Authentication
echo ========================================
echo.
echo This will start both backend and frontend servers
echo with authentication enabled.
echo.
echo Make sure you have:
echo ✓ Run SETUP-AUTH-COMPLETE.bat first
echo ✓ Added JWT_SECRET to your .env file
echo ✓ MySQL server is running
echo.
pause
echo.

echo Starting backend server...
start "ThreadChain Backend" cmd /k "npm run backend"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "ThreadChain Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ Servers Started!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Pages:
echo - Signup: http://localhost:3000/signup
echo - Login: http://localhost:3000/login
echo - Dashboard: http://localhost:3000/dashboard
echo.
echo Press any key to close this window...
pause >nul

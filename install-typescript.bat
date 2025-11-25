@echo off
echo ========================================
echo   Installing TypeScript Dependencies
echo ========================================
echo.

echo Installing TypeScript, @types/react, @types/node...
echo.

npm install --save-dev typescript @types/react @types/node

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Now you can start the frontend with:
echo npm run frontend
echo.
pause

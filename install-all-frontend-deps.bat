@echo off
echo ========================================
echo   Installing All Frontend Dependencies
echo ========================================
echo.

echo Installing Next.js and React...
npm install next react react-dom

echo.
echo Installing Tailwind CSS...
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss

echo.
echo Installing TypeScript...
npm install -D typescript @types/react @types/node @types/react-dom

echo.
echo Installing UI dependencies...
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install recharts

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Now start the frontend with:
echo npx next dev
echo.
pause

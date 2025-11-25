@echo off
echo Installing all missing frontend dependencies...
echo.

REM Core UI dependencies
npm install lucide-react class-variance-authority clsx tailwind-merge

REM Radix UI components (required for shadcn/ui)
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip

REM Additional UI libraries
npm install recharts sonner vaul cmdk date-fns react-day-picker embla-carousel-react input-otp react-resizable-panels

REM Form handling
npm install react-hook-form @hookform/resolvers zod

REM Utilities
npm install next-themes

echo.
echo Installation complete!
echo Now clearing Next.js cache...
rmdir /s /q .next
echo Cache cleared!
echo.
echo Please restart your dev server now.
pause

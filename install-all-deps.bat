@echo off
echo Installing ALL missing dependencies...
echo.

npm install lucide-react class-variance-authority clsx tailwind-merge @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip recharts sonner vaul cmdk date-fns react-day-picker embla-carousel-react input-otp react-resizable-panels react-hook-form @hookform/resolvers zod

echo.
echo Clearing Next.js cache...
if exist .next rmdir /s /q .next
echo.
echo Done! Now run: npm run dev
pause

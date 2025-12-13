#!/bin/bash

echo "🚀 Starting ThreatChain - Full Stack"
echo "====================================="
echo ""
echo "This will open 2 terminal windows:"
echo "  1. Backend Server (port 3001)"
echo "  2. Frontend App (port 3000)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the ThreatChain directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
    echo ""
fi

# Detect terminal emulator and open new terminals
if command -v gnome-terminal &> /dev/null; then
    # GNOME Terminal
    echo "Opening terminals with gnome-terminal..."
    gnome-terminal -- bash -c "cd $(pwd) && ./start-backend.sh; exec bash"
    sleep 2
    gnome-terminal -- bash -c "cd $(pwd) && ./start-frontend.sh; exec bash"
    
elif command -v konsole &> /dev/null; then
    # KDE Konsole
    echo "Opening terminals with konsole..."
    konsole -e bash -c "cd $(pwd) && ./start-backend.sh; exec bash" &
    sleep 2
    konsole -e bash -c "cd $(pwd) && ./start-frontend.sh; exec bash" &
    
elif command -v xterm &> /dev/null; then
    # xterm
    echo "Opening terminals with xterm..."
    xterm -e "cd $(pwd) && ./start-backend.sh; exec bash" &
    sleep 2
    xterm -e "cd $(pwd) && ./start-frontend.sh; exec bash" &
    
elif command -v x-terminal-emulator &> /dev/null; then
    # Generic terminal
    echo "Opening terminals with x-terminal-emulator..."
    x-terminal-emulator -e "cd $(pwd) && ./start-backend.sh; exec bash" &
    sleep 2
    x-terminal-emulator -e "cd $(pwd) && ./start-frontend.sh; exec bash" &
    
else
    echo "⚠️  Could not detect terminal emulator!"
    echo ""
    echo "Please manually open 2 terminals and run:"
    echo "  Terminal 1: ./start-backend.sh"
    echo "  Terminal 2: ./start-frontend.sh"
    exit 1
fi

echo ""
echo "✅ Terminals opened!"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "To stop: Close the terminal windows or press Ctrl+C in each"

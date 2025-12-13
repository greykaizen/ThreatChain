#!/bin/bash

echo "🚀 Starting ThreatChain with Ethereum..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the ThreatChain directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Kill existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "hardhat node" 2>/dev/null
pkill -f "node server.js" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Check if gnome-terminal is available (Ubuntu/Debian)
if command -v gnome-terminal &> /dev/null; then
    TERMINAL="gnome-terminal"
# Check if konsole is available (KDE)
elif command -v konsole &> /dev/null; then
    TERMINAL="konsole"
# Check if xterm is available (fallback)
elif command -v xterm &> /dev/null; then
    TERMINAL="xterm"
else
    echo "❌ No supported terminal found. Please install gnome-terminal, konsole, or xterm"
    exit 1
fi

echo "✅ Using terminal: $TERMINAL"
echo ""

# Start Hardhat node in new terminal
echo "📦 Starting Ethereum node..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal -- bash -c "cd $(pwd) && echo '🔗 Starting Hardhat Ethereum Node...' && npx hardhat node; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole -e bash -c "cd $(pwd) && echo '🔗 Starting Hardhat Ethereum Node...' && npx hardhat node; exec bash" &
else
    xterm -e "cd $(pwd) && echo '🔗 Starting Hardhat Ethereum Node...' && npx hardhat node; exec bash" &
fi

# Wait for Hardhat to start
echo "⏳ Waiting for Ethereum node to start..."
sleep 8

# Check if Hardhat is running
if check_port 8545; then
    echo "✅ Ethereum node is running on port 8545"
else
    echo "❌ Ethereum node failed to start"
    exit 1
fi

# Start Backend in new terminal
echo "🖥️  Starting Backend server..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal -- bash -c "cd $(pwd) && echo '🚀 Starting Backend Server...' && npm run backend; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole -e bash -c "cd $(pwd) && echo '🚀 Starting Backend Server...' && npm run backend; exec bash" &
else
    xterm -e "cd $(pwd) && echo '🚀 Starting Backend Server...' && npm run backend; exec bash" &
fi

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if check_port 3001; then
    echo "✅ Backend is running on port 3001"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start Frontend in new terminal
echo "🌐 Starting Frontend..."
if [ "$TERMINAL" = "gnome-terminal" ]; then
    gnome-terminal -- bash -c "cd $(pwd) && echo '⚛️  Starting Frontend...' && npm run dev; exec bash"
elif [ "$TERMINAL" = "konsole" ]; then
    konsole -e bash -c "cd $(pwd) && echo '⚛️  Starting Frontend...' && npm run dev; exec bash" &
else
    xterm -e "cd $(pwd) && echo '⚛️  Starting Frontend...' && npm run dev; exec bash" &
fi

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 8

# Check if frontend is running
if check_port 3000; then
    echo "✅ Frontend is running on port 3000"
else
    echo "⚠️  Frontend might still be starting..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ThreatChain Started Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Services Running:"
echo "   • Ethereum Node:  http://localhost:8545"
echo "   • Backend API:    http://localhost:3001"
echo "   • Frontend:       http://localhost:3000"
echo ""
echo "🌐 Open in browser: http://localhost:3000"
echo ""
echo "🛑 To stop all services:"
echo "   ./stop-everything.sh"
echo ""
echo "📖 Check status:"
echo "   curl http://localhost:3001/api/health"
echo "   curl http://localhost:3001/api/blockchain/ethereum/status"
echo "   curl http://localhost:3001/api/blockchain/metrics"
echo ""

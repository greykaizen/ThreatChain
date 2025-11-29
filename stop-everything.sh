#!/bin/bash

echo "🛑 Stopping ThreatChain services..."
echo ""

# Kill Hardhat node
echo "Stopping Ethereum node..."
pkill -f "hardhat node"

# Kill Backend
echo "Stopping Backend server..."
pkill -f "node server.js"

# Kill Frontend
echo "Stopping Frontend..."
pkill -f "next dev"

# Wait a moment
sleep 2

# Check if processes are stopped
if pgrep -f "hardhat node" > /dev/null; then
    echo "⚠️  Ethereum node still running, force killing..."
    pkill -9 -f "hardhat node"
fi

if pgrep -f "node server.js" > /dev/null; then
    echo "⚠️  Backend still running, force killing..."
    pkill -9 -f "node server.js"
fi

if pgrep -f "next dev" > /dev/null; then
    echo "⚠️  Frontend still running, force killing..."
    pkill -9 -f "next dev"
fi

echo ""
echo "✅ All services stopped!"
echo ""

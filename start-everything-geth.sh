#!/bin/bash

echo "🚀 Starting ThreatChain with Geth"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Geth is set up
if [ ! -d "geth-data" ]; then
    echo -e "${RED}❌ Geth not set up${NC}"
    echo "   Run: ./setup-geth.sh"
    exit 1
fi

# Check if contract is deployed
if ! grep -q "ETHEREUM_CONTRACT_ADDRESS=0x" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Contract not deployed${NC}"
    echo "   Run: node scripts/deploy-to-geth.js"
    echo ""
    read -p "Do you want to deploy now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting Geth temporarily for deployment..."
        ./start-geth.sh &
        TEMP_GETH_PID=$!
        sleep 10
        
        echo "Deploying contract..."
        node scripts/deploy-to-geth.js
        
        echo "Stopping temporary Geth..."
        kill $TEMP_GETH_PID
        sleep 2
    else
        exit 1
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    if [ ! -z "$GETH_PID" ]; then
        kill $GETH_PID 2>/dev/null
        echo "   Stopped Geth"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "   Stopped Backend"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "   Stopped Frontend"
    fi
    
    echo "✅ All services stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Start Geth in background (dev mode with auto-mining)
echo "1️⃣  Starting Geth Ethereum Node..."
geth \
  --datadir ./geth-data \
  --http \
  --http.addr "0.0.0.0" \
  --http.port 8545 \
  --http.api "eth,net,web3,personal,admin,txpool" \
  --http.corsdomain "*" \
  --verbosity 2 \
  --dev \
  --dev.period 5 \
  > geth.log 2>&1 &

GETH_PID=$!
echo -e "${GREEN}✅ Geth started (PID: $GETH_PID)${NC}"
echo "   Waiting for Geth to be ready..."
sleep 8

# Check if Geth is responding
if curl -s -X POST -H "Content-Type: application/json" \
   --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
   http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Geth is ready${NC}"
else
    echo -e "${RED}❌ Geth failed to start${NC}"
    echo "   Check geth.log for details"
    exit 1
fi

echo ""
echo "2️⃣  Starting Backend Server..."
npm run backend > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
sleep 3

# Check if backend is responding
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may still be starting...${NC}"
fi

echo ""
echo "3️⃣  Starting Frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo "=================================="
echo -e "${GREEN}✅ All Services Running!${NC}"
echo "=================================="
echo ""
echo "📊 Service URLs:"
echo "   🔗 Geth RPC:    http://localhost:8545"
echo "   🔧 Backend API: http://localhost:3001"
echo "   🌐 Frontend:    http://localhost:3000"
echo ""
echo "📋 Process IDs:"
echo "   Geth:     $GETH_PID"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Geth:     tail -f geth.log"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Wait indefinitely
wait

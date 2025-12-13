#!/bin/bash

echo "🚀 Starting Geth Ethereum Node"
echo "=============================="
echo ""

# Check if geth-data exists
if [ ! -d "geth-data" ]; then
    echo "❌ geth-data directory not found"
    echo "   Run ./setup-geth.sh first"
    exit 1
fi

# Check if Geth is installed
if ! command -v geth &> /dev/null; then
    echo "❌ Geth is not installed"
    echo "   Run ./setup-geth.sh first"
    exit 1
fi

echo "✅ Starting Geth node..."
echo "   Network ID: 1337"
echo "   RPC: http://localhost:8545"
echo "   Mining: Enabled (5 second blocks)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start Geth in dev mode (auto-mining for development)
geth \
  --datadir ./geth-data \
  --http \
  --http.addr "0.0.0.0" \
  --http.port 8545 \
  --http.api "eth,net,web3,personal,admin,debug,txpool" \
  --http.corsdomain "*" \
  --verbosity 3 \
  --dev \
  --dev.period 5 \
  console

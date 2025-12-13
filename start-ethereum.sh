#!/bin/bash

echo "🚀 ThreatChain Ethereum Setup"
echo "=============================="
echo ""

# Check if Hardhat is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules/hardhat" ]; then
    echo "📦 Installing Hardhat dependencies..."
    npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
    echo ""
fi

# Check if contract is already deployed
if [ -f "deployment-info.json" ]; then
    echo "✅ Contract already deployed!"
    echo ""
    cat deployment-info.json
    echo ""
    echo "To redeploy, delete deployment-info.json and run this script again."
    exit 0
fi

# Start Hardhat node in background
echo "🔧 Starting local Ethereum node..."
npx hardhat node > hardhat-node.log 2>&1 &
HARDHAT_PID=$!
echo "   PID: $HARDHAT_PID"
echo "   Logs: hardhat-node.log"
echo ""

# Wait for node to start
echo "⏳ Waiting for node to initialize..."
sleep 5

# Deploy contract
echo "📝 Deploying ThreatIntelRegistry contract..."
npx hardhat run scripts/deploy.js --network localhost

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update your .env file with the contract address shown above"
    echo "2. Set ETHEREUM_ENABLED=true in .env"
    echo "3. Restart your backend: npm run backend"
    echo ""
    echo "🧪 To test the contract:"
    echo "   npx hardhat run scripts/test-ethereum.js --network localhost"
    echo ""
    echo "🛑 To stop the Ethereum node:"
    echo "   kill $HARDHAT_PID"
    echo "   or: pkill -f 'hardhat node'"
else
    echo ""
    echo "❌ Deployment failed. Check the error above."
    kill $HARDHAT_PID
    exit 1
fi

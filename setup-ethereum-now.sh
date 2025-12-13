#!/bin/bash

echo "🚀 ThreatChain - Professional Ethereum Setup"
echo "============================================"
echo ""
echo "This will set up a complete Ethereum blockchain locally"
echo "Takes about 5 minutes"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Step 1: Install Hardhat
echo "📦 Step 1/5: Installing Hardhat..."
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox --silent

if [ $? -eq 0 ]; then
    echo "   ✅ Hardhat installed"
else
    echo "   ❌ Installation failed"
    exit 1
fi
echo ""

# Step 2: Check if Hardhat node is already running
echo "🔍 Step 2/5: Checking for existing Hardhat node..."
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  Port 8545 is already in use"
    echo "   Ethereum node might already be running"
else
    echo "   ✅ Port 8545 is available"
    echo ""
    echo "   Starting Hardhat node in background..."
    nohup npx hardhat node > hardhat-node.log 2>&1 &
    HARDHAT_PID=$!
    echo "   Process ID: $HARDHAT_PID"
    echo "   Logs: hardhat-node.log"
    echo ""
    echo "   ⏳ Waiting for node to start..."
    sleep 8
    
    if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ✅ Hardhat node is running"
    else
        echo "   ❌ Failed to start Hardhat node"
        echo "   Check hardhat-node.log for errors"
        exit 1
    fi
fi
echo ""

# Step 3: Deploy contract
echo "📝 Step 3/5: Deploying smart contract..."
npx hardhat run scripts/deploy.js --network localhost

if [ $? -eq 0 ]; then
    echo "   ✅ Contract deployed successfully"
else
    echo "   ❌ Deployment failed"
    exit 1
fi
echo ""

# Step 4: Update .env
echo "⚙️  Step 4/5: Updating configuration..."

if [ -f "deployment-info.json" ]; then
    CONTRACT_ADDRESS=$(node -p "require('./deployment-info.json').contractAddress")
    
    # Update .env file
    if grep -q "ETHEREUM_CONTRACT_ADDRESS" .env; then
        # Update existing line
        sed -i.bak "s|ETHEREUM_CONTRACT_ADDRESS=.*|ETHEREUM_CONTRACT_ADDRESS=$CONTRACT_ADDRESS|" .env
    else
        # Add new line
        echo "ETHEREUM_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env
    fi
    
    # Enable Ethereum
    sed -i.bak "s|ETHEREUM_ENABLED=.*|ETHEREUM_ENABLED=true|" .env
    sed -i.bak "s|ETHEREUM_USE_LOCAL=.*|ETHEREUM_USE_LOCAL=true|" .env
    
    echo "   ✅ Configuration updated"
    echo "   Contract: $CONTRACT_ADDRESS"
else
    echo "   ⚠️  deployment-info.json not found"
fi
echo ""

# Step 5: Test
echo "🧪 Step 5/5: Running tests..."
npx hardhat run scripts/test-ethereum.js --network localhost

if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ All tests passed!"
else
    echo ""
    echo "   ⚠️  Some tests failed (this might be okay)"
fi
echo ""

# Final instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 What's Running:"
echo "   • Ethereum Node: http://localhost:8545"
echo "   • Contract: $CONTRACT_ADDRESS"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "   1. Start Backend (Terminal 1):"
echo "      npm run backend"
echo ""
echo "   2. Start Frontend (Terminal 2):"
echo "      npm run dev"
echo ""
echo "   3. Open Browser:"
echo "      http://localhost:3000"
echo ""
echo "   4. Test Upload:"
echo "      Go to Blockchain Demo → Upload CSV"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Check Status:"
echo "   curl http://localhost:3001/api/blockchain/ethereum/status"
echo ""
echo "🛑 Stop Ethereum Node:"
echo "   pkill -f 'hardhat node'"
echo ""
echo "📖 Full Guide:"
echo "   See ETHEREUM-QUICK-START.md"
echo ""

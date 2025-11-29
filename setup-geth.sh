#!/bin/bash

echo "🚀 Setting Up Geth Ethereum Node"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Geth is installed
echo "1️⃣  Checking Geth installation..."
if command -v geth &> /dev/null; then
    GETH_VERSION=$(geth version | grep "Version:" | awk '{print $2}')
    echo -e "${GREEN}✅ Geth is installed: $GETH_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Geth is not installed${NC}"
    echo ""
    echo "Installing Geth..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Detected Linux system"
        sudo add-apt-repository -y ppa:ethereum/ethereum
        sudo apt-get update
        sudo apt-get install -y ethereum
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Detected macOS system"
        brew tap ethereum/ethereum
        brew install ethereum
    else
        echo -e "${RED}❌ Unsupported OS. Please install Geth manually:${NC}"
        echo "   https://geth.ethereum.org/downloads/"
        exit 1
    fi
    
    # Verify installation
    if command -v geth &> /dev/null; then
        echo -e "${GREEN}✅ Geth installed successfully${NC}"
    else
        echo -e "${RED}❌ Geth installation failed${NC}"
        exit 1
    fi
fi

echo ""
echo "2️⃣  Creating Geth data directory..."
if [ -d "geth-data" ]; then
    echo -e "${YELLOW}⚠️  geth-data directory already exists${NC}"
    read -p "Do you want to remove it and start fresh? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf geth-data
        echo -e "${GREEN}✅ Removed old geth-data${NC}"
    else
        echo "Keeping existing data..."
    fi
fi

if [ ! -d "geth-data" ]; then
    mkdir -p geth-data
    echo -e "${GREEN}✅ Created geth-data directory${NC}"
fi

echo ""
echo "3️⃣  Setup complete - using dev mode..."
echo -e "${BLUE}ℹ️  Dev mode will auto-create accounts and mine blocks${NC}"
echo -e "${GREEN}✅ No genesis initialization needed for dev mode${NC}"

echo ""
echo "================================="
echo -e "${GREEN}✅ Geth Setup Complete!${NC}"
echo "================================="
echo ""
echo "📋 Configuration:"
echo "   Mode: Development (--dev)"
echo "   Network ID: 1337"
echo "   RPC Port: 8545"
echo "   Data Directory: ./geth-data"
echo "   Block Time: 5 seconds"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start everything: ./start-everything-geth.sh"
echo "      (This will start Geth, deploy contracts, and start the app)"
echo ""
echo "   Or manually:"
echo "   1. Start Geth: ./start-geth.sh"
echo "   2. Deploy contracts: node scripts/deploy-to-geth.js"
echo "   3. Start backend: npm run backend"
echo "   4. Start frontend: npm run dev"
echo ""
echo "📖 Documentation: GETH-IMPLEMENTATION-PLAN.md"
echo ""

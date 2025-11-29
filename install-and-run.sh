#!/bin/bash

echo "📦 ThreatChain - Install and Run"
echo "================================="
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the ThreatChain directory"
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Make scripts executable
chmod +x start-backend.sh
chmod +x start-frontend.sh
chmod +x start-all.sh

echo "🚀 Starting the application..."
echo ""

./start-all.sh

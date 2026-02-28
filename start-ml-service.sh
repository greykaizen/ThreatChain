#!/bin/bash

# Script to start the ML service
echo "🚀 Starting ML Trust Score Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python 3.x"
    exit 1
fi

# Check if the ml-service directory exists
if [ ! -d "ml-service" ]; then
    echo "❌ ml-service directory not found!"
    echo "Please run the ML pipeline first using: node scripts/run-ml-pipeline.js"
    exit 1
fi

# Check if requirements are installed
echo "🔍 Checking Python dependencies..."
pip3 list | grep -q xgboost
if [ $? -ne 0 ]; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r ml-service/requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Python dependencies"
        exit 1
    fi
else
    echo "✅ Python dependencies already installed"
fi

# Check if models exist
if [ ! -f "models/xgboost_abuse_score.pkl" ] || [ ! -f "models/xgboost_auto_block.pkl" ]; then
    echo "⚠️ Warning: Model files not found!"
    echo "💡 Tip: Run the ML pipeline first: node scripts/run-ml-pipeline.js"
    echo "💡 Continuing anyway (models will be loaded as None if not found)..."
fi

# Start the ML service
echo "🏃 Starting ML service on port 5001..."
cd ml-service && python3 app.py

echo "✅ ML service stopped."
#!/bin/bash

echo "========================================"
echo "   ThreadChain Complete Setup"
echo "========================================"
echo ""
echo "MySQL Password: 9110"
echo ""

echo "Step 1: Installing dependencies..."
echo ""
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] npm install failed!"
    exit 1
fi
echo "[OK] Dependencies installed"
echo ""

echo "Step 2: Creating uploads folder..."
if [ ! -d "uploads" ]; then
    mkdir uploads
    echo "[OK] uploads folder created"
else
    echo "[OK] uploads folder already exists"
fi
echo ""

echo "Step 3: Initializing database..."
echo ""
npm run init-db
if [ $? -ne 0 ]; then
    echo "[ERROR] Database initialization failed!"
    echo "Please check:"
    echo "1. MySQL is running"
    echo "2. Password in .env is correct (9110)"
    exit 1
fi
echo "[OK] Database initialized"
echo ""

echo "========================================"
echo "   Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run: ./start-backend.sh (to start backend)"
echo "2. In new terminal, run: ./start-frontend.sh (to start frontend)"
echo ""
echo "Or use the all-in-one script:"
echo "   ./start-all.sh"
echo ""

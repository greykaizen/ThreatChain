#!/bin/bash

echo "🧪 Testing Blockchain Duplicate Block Fix"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking if backend is running..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "   Please start the backend first:"
    echo "   cd ThreatChain && npm run backend"
    exit 1
fi

echo ""
echo "2️⃣  Checking database connection..."
if mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "USE threatchain; SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "   Please check your MySQL credentials"
    exit 1
fi

echo ""
echo "3️⃣  Checking blockchain blocks..."
BLOCK_COUNT=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "USE threatchain; SELECT COUNT(*) FROM blockchain_blocks;")
echo "   Current blocks in chain: $BLOCK_COUNT"

if [ "$BLOCK_COUNT" -gt 0 ]; then
    echo ""
    echo "   Latest blocks:"
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "USE threatchain; SELECT block_number, LEFT(block_hash, 16) as hash, timestamp FROM blockchain_blocks ORDER BY block_number DESC LIMIT 5;"
fi

echo ""
echo "4️⃣  Checking for block number gaps..."
GAPS=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "
USE threatchain;
SELECT COUNT(*) FROM (
  SELECT block_number, 
         block_number - LAG(block_number) OVER (ORDER BY block_number) as gap
  FROM blockchain_blocks
) t WHERE gap > 1;
")

if [ "$GAPS" -eq 0 ]; then
    echo -e "${GREEN}✅ No gaps in block numbers${NC}"
else
    echo -e "${YELLOW}⚠️  Found $GAPS gaps in block numbers${NC}"
    echo "   This might indicate previous duplicate issues"
fi

echo ""
echo "5️⃣  Checking STIX reports..."
REPORT_COUNT=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "USE threatchain; SELECT COUNT(*) FROM stix_reports;")
echo "   Total STIX reports: $REPORT_COUNT"

if [ "$REPORT_COUNT" -gt 0 ]; then
    echo ""
    echo "   Recent reports:"
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "USE threatchain; SELECT id, title, LEFT(hash, 16) as hash, created_at FROM stix_reports ORDER BY created_at DESC LIMIT 5;"
fi

echo ""
echo "6️⃣  Checking blockchain transactions..."
TX_COUNT=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "USE threatchain; SELECT COUNT(*) FROM blockchain_transactions;")
echo "   Total transactions: $TX_COUNT"

if [ "$TX_COUNT" -gt 0 ]; then
    echo ""
    echo "   Recent transactions:"
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "USE threatchain; SELECT LEFT(id, 8) as id, block_number, status, timestamp FROM blockchain_transactions ORDER BY timestamp DESC LIMIT 5;"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Blockchain Fix Verification Complete${NC}"
echo ""
echo "📝 Next Steps:"
echo "   1. Try uploading a STIX report via the UI"
echo "   2. Try uploading the SAME report again (should show duplicate error)"
echo "   3. Upload a different report (should get next block number)"
echo ""
echo "🔍 To monitor in real-time:"
echo "   watch -n 2 'mysql -u root -p\"$MYSQL_ROOT_PASSWORD\" -e \"USE threatchain; SELECT block_number, LEFT(block_hash, 16) as hash FROM blockchain_blocks ORDER BY block_number DESC LIMIT 10;\"'"

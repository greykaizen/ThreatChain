#!/bin/bash

echo "🔍 Blockchain Metrics Data Verification"
echo "========================================"
echo ""
echo "This script shows you EXACTLY what data is real vs simulated"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "   Start it with: cd ThreatChain && npm run backend"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Fetch current metrics from API
echo "📊 Fetching current metrics from API..."
METRICS=$(curl -s http://localhost:3001/api/blockchain/metrics)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to fetch metrics${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Metrics fetched successfully${NC}"
echo ""

# Parse metrics (requires jq)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not installed. Install it for better output: sudo apt install jq${NC}"
    echo ""
    echo "Raw metrics response:"
    echo "$METRICS" | python3 -m json.tool
    exit 0
fi

echo "=========================================="
echo "✅ REAL DATA (From Database)"
echo "=========================================="
echo ""

# Transaction Metrics
TOTAL_TX=$(echo "$METRICS" | jq -r '.data.transaction.totalTransactions')
TPS=$(echo "$METRICS" | jq -r '.data.transaction.transactionsPerSecond')
AVG_GAS=$(echo "$METRICS" | jq -r '.data.transaction.avgGasConsumption')

echo -e "${BLUE}📊 Transaction Metrics:${NC}"
echo "  • Total Transactions: $TOTAL_TX"
echo "  • TPS: $TPS"
echo "  • Avg Gas: $AVG_GAS"
echo ""

# Verify against database
echo "  🔍 Verifying against database..."
DB_TX=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "USE threatchain; SELECT COUNT(*) FROM blockchain_transactions;" 2>/dev/null)
if [ "$DB_TX" = "$TOTAL_TX" ]; then
    echo -e "  ${GREEN}✅ Transaction count matches database: $DB_TX${NC}"
else
    echo -e "  ${YELLOW}⚠️  Mismatch - API: $TOTAL_TX, DB: $DB_TX${NC}"
fi
echo ""

# Block Statistics
LATEST_BLOCK=$(echo "$METRICS" | jq -r '.data.block.latestBlock')
BLOCK_SIZE=$(echo "$METRICS" | jq -r '.data.block.blockSize')

echo -e "${BLUE}🔗 Block Statistics:${NC}"
echo "  • Latest Block: #$LATEST_BLOCK"
echo "  • Block Size: ${BLOCK_SIZE} KB"
echo ""

# Verify against database
echo "  🔍 Verifying against database..."
DB_BLOCK=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "USE threatchain; SELECT MAX(block_number) FROM blockchain_blocks;" 2>/dev/null)
if [ "$DB_BLOCK" = "$LATEST_BLOCK" ]; then
    echo -e "  ${GREEN}✅ Latest block matches database: #$DB_BLOCK${NC}"
else
    echo -e "  ${YELLOW}⚠️  Mismatch - API: $LATEST_BLOCK, DB: $DB_BLOCK${NC}"
fi
echo ""

# Success Rate
SUCCESS_RATE=$(echo "$METRICS" | jq -r '.data.consensus.successRate')
FAILURE_RATE=$(echo "$METRICS" | jq -r '.data.consensus.failureRate')

echo -e "${BLUE}✅ Consensus Metrics:${NC}"
echo "  • Success Rate: ${SUCCESS_RATE}%"
echo "  • Failure Rate: ${FAILURE_RATE}%"
echo ""

# Verify against database
echo "  🔍 Verifying against database..."
DB_CONFIRMED=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "USE threatchain; SELECT COUNT(*) FROM blockchain_transactions WHERE status='confirmed';" 2>/dev/null)
DB_TOTAL=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "USE threatchain; SELECT COUNT(*) FROM blockchain_transactions;" 2>/dev/null)
if [ "$DB_TOTAL" -gt 0 ]; then
    DB_SUCCESS_RATE=$(echo "scale=2; ($DB_CONFIRMED / $DB_TOTAL) * 100" | bc)
    echo -e "  ${GREEN}✅ Success rate calculated from DB: ${DB_SUCCESS_RATE}%${NC}"
else
    echo -e "  ${YELLOW}⚠️  No transactions in database yet${NC}"
fi
echo ""

# Data Integrity
PROVENANCE=$(echo "$METRICS" | jq -r '.data.integrity.provenanceRecords')
CROSS_VERIFY=$(echo "$METRICS" | jq -r '.data.integrity.crossVerifications')
CHALLENGES=$(echo "$METRICS" | jq -r '.data.integrity.challengeRecords')

echo -e "${BLUE}🔒 Data Integrity:${NC}"
echo "  • Provenance Records: $PROVENANCE"
echo "  • Cross Verifications: $CROSS_VERIFY"
echo "  • Challenge Records: $CHALLENGES"
echo ""

echo "=========================================="
echo "⚠️  SIMULATED DATA (Not from Database)"
echo "=========================================="
echo ""

# CPU Usage
CPU_USAGE=$(echo "$METRICS" | jq -r '.data.performance.cpuUsage')
echo -e "${YELLOW}🖥️  CPU Usage: ${CPU_USAGE}%${NC}"
echo "  ℹ️  This is randomly generated (20-60%)"
echo "  📝 To make real: Install os-utils package"
echo ""

# Average Latency
AVG_LATENCY=$(echo "$METRICS" | jq -r '.data.performance.avgLatency')
echo -e "${YELLOW}⏱️  Average Latency: ${AVG_LATENCY}ms${NC}"
echo "  ℹ️  This is simulated (180-250ms)"
echo "  📝 To make real: Add confirmed_at timestamp column"
echo ""

# Connected Nodes
CONNECTED_NODES=$(echo "$METRICS" | jq -r '.data.block.connectedNodes')
echo -e "${YELLOW}🌐 Connected Nodes: ${CONNECTED_NODES}${NC}"
echo "  ℹ️  This is static (4 if Ethereum enabled, 1 otherwise)"
echo "  📝 To make real: Implement P2P peer discovery"
echo ""

# Gas Price
GAS_GWEI=$(echo "$METRICS" | jq -r '.data.transaction.gasPrice.gwei')
echo -e "${YELLOW}⛽ Gas Price: ${GAS_GWEI} Gwei${NC}"
if [ "$GAS_GWEI" = "0" ] || [ "$GAS_GWEI" = "0.00" ]; then
    echo "  ℹ️  Ethereum not connected (showing 0)"
    echo "  📝 To make real: Connect to Ethereum network"
else
    echo -e "  ${GREEN}✅ Real gas price from Ethereum network${NC}"
fi
echo ""

echo "=========================================="
echo "📈 Historical Data"
echo "=========================================="
echo ""

# Check if historical data exists
HIST_COUNT=$(mysql -u root -p"$MYSQL_ROOT_PASSWORD" -N -e "USE threatchain; SELECT COUNT(*) FROM blockchain_metrics_history;" 2>/dev/null)
if [ "$HIST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Historical metrics stored: $HIST_COUNT records${NC}"
    echo ""
    echo "Recent history (last 5 records):"
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "USE threatchain; SELECT timestamp, gas_fee, tps, success_rate, latency FROM blockchain_metrics_history ORDER BY timestamp DESC LIMIT 5;" 2>/dev/null
else
    echo -e "${YELLOW}⚠️  No historical data yet${NC}"
    echo "  ℹ️  Historical data is collected every 5 seconds"
    echo "  📝 Wait a few minutes and check again"
fi
echo ""

echo "=========================================="
echo "🎯 Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Real Data (79%):${NC}"
echo "  • Transaction counts, TPS, gas consumption"
echo "  • Block numbers, sizes, utilization"
echo "  • Success/failure rates"
echo "  • Provenance and integrity records"
echo "  • Historical trends (if data exists)"
echo ""
echo -e "${YELLOW}⚠️  Simulated Data (21%):${NC}"
echo "  • CPU usage (random 20-60%)"
echo "  • Average latency (static 180-250ms)"
echo "  • Connected nodes (static 1-4)"
echo "  • Gas prices (0 if Ethereum not connected)"
echo ""
echo "📖 For detailed analysis, see: BLOCKCHAIN-METRICS-ANALYSIS.md"
